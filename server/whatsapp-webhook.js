const crypto = require('crypto');
const express = require('express');
const router = express.Router();

// WhatsApp webhook endpoint
router.post('/whatsapp/webhook', async (req, res) => {
  try {
    // Verify webhook (for initial setup)
    if (req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }

    const data = req.body;
    
    if (!data || !data.object) {
      return res.status(400).json({ error: 'No data received' });
    }

    // Process WhatsApp messages
    for (const entry of data.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          for (const message of change.value.messages) {
            if (message.type === 'text') {
              const processedData = processWhatsAppMessage(message);
              
              // Auto-import if enabled and confidence is high
              if (processedData && processedData.confidence >= 75) {
                await autoImportDiver(processedData, req.db);
              }

              // Send auto-reply if enabled
              if (process.env.WHATSAPP_AUTO_REPLY === 'true') {
                const replyMessage = generateWhatsAppReply(message, processedData);
                await sendWhatsAppReply(message.from, replyMessage);
              }
            }
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function processWhatsAppMessage(message) {
  const content = message.text.body || '';
  const data = {
    confidence: 0,
    source: 'whatsapp',
    originalMessage: content,
    whatsappId: message.from,
    timestamp: message.timestamp,
  };

  let confidence = 0;

  // Enhanced name patterns for WhatsApp
  const namePatterns = [
    /(?:Hi|Hello|Hey|Good morning|Good afternoon),?\s+(?:I'm|I am|my name is|this is|it's)\s+([a-zA-Z\u4e00-\u9fa5\s]+)/i,
    /(?:我叫|my name is|姓名[:：])\s*([a-zA-Z\u4e00-\u9fa5\s]+)/i,
    /([a-zA-Z\u4e00-\u9fa5]{2,10})\s+(?:here|speaking|writing|interested)/i,
    /^([a-zA-Z\u4e00-\u9fa5]{2,15})\s*$/m, // Single name at start
    /(?:I'm|i am)\s+([a-zA-Z\u4e00-\u9fa5\s]+)\s+(?:and|&)\s+([a-zA-Z\u4e00-\u9fa5\s]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[1] && match[2]) {
        data.firstName = match[1].trim();
        data.lastName = match[2].trim();
      } else {
        const name = match[1].trim();
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
          data.firstName = parts[0];
          data.lastName = parts.slice(1).join(' ');
        } else {
          data.firstName = name;
        }
      }
      confidence += 25;
      break;
    }
  }

  // Enhanced email patterns
  const emailPatterns = [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /(?:email|mail|e-mail)[:：]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /(?:at|@)\s*([a-zA-Z0-9._%+-]+)\s*(dot|\.)\s*([a-zA-Z]{2,})/i,
    /(?:reach|contact)\s+(?:me|us)\s+(?:at|on|via)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ];

  for (const pattern of emailPatterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[1] && match[2]) {
        data.email = `${match[1]}@${match[2]}`;
      } else {
        data.email = match[1];
      }
      confidence += 30;
      break;
    }
  }

  // Enhanced phone patterns (WhatsApp specific)
  const phonePatterns = [
    /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/, // US format
    /(?:\+?44[-.\s]?)?\(?([0-9]{3,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4})/, // UK format
    /(?:\+?86[-.\s]?)?1[3-9]\d{9}/, // China format
    /(?:\+?91[-.\s]?)?\(?([0-9]{3,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4})/, // India format
    /\+?\d{10,15}/, // General international
    /(?:phone|mobile|cell|call|whatsapp|contact)[:：]?\s*(\+?\d+)/i,
    /(?:my|contact|reach)\s+(?:number|no|phone)[:：]?\s*(\+?\d+)/i,
    /\b(\+?\d{10,15})\b/, // Standalone number
  ];

  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[1] && match[2] && match[3]) {
        data.phone = `+1${match[1]}${match[2]}${match[3]}`; // US format
      } else {
        data.phone = match[1] || match[0];
      }
      confidence += 25;
      break;
    }
  }

  // Enhanced certification patterns
  const certPatterns = [
    /(?:Not Certified|PADI|SSI|NAUI|CMAS|DSD|Snorkelling)\s+(Open Water|Advanced|Rescue|Divemaster|Instructor|Discover Scuba Diving)/i,
    /(?:certified|certification|cert|c-card)[:：]?\s*([a-zA-Z\s]+(?:diver|instructor))/i,
    /(?:I'm|i am)\s+(?:a\s+)?([a-zA-Z\s]+)\s+(?:certified|diver)/i,
    /(?:潜水证|diving\s+cert|not\s+certified)[:：]?\s*([a-zA-Z\s]+)/i,
  ];

  for (const pattern of certPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.certification = match[1] || match[0];
      confidence += 20;
      break;
    }
  }

  // Enhanced experience patterns
  const expPatterns = [
    /(?:I've|i have|done|completed)\s+(\d+)\s*(?:dives?|dive|times)/i,
    /(?:experience|level|exp)[:：]?\s*(\d+)\s*(?:dives?|dive|times|dives)/i,
    /(?:潜水了|diving)\s+(\d+)\s*(?:次|times|dives)/i,
    /(?:beginner|intermediate|advanced|expert|pro|master)/i,
    /(?:since|from)\s+(\d{4})\s+(?:I've|i have)/i, // Years since starting
  ];

  for (const pattern of expPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.experience = match[1] || match[0];
      confidence += 15;
      break;
    }
  }

  // Medical clearance patterns
  const medicalPatterns = [
    /(?:medical|health|fit|clearance)[:：]?\s*(clear|cleared|ok|good|fine|yes|passed)/i,
    /(?:no\s+)?(?:medical\s+)?(issues|problems|concerns|conditions)/i,
    /(?:fit|healthy|cleared|medically\s+fit)\s+(?:for|to)\s+(?:dive|scuba)/i,
    /(?:医疗|健康)[:：]?\s*(通过|良好|ok)/i,
    /(?:doctor|physician)\s+(?:cleared|approved|signed)/i,
  ];

  for (const pattern of medicalPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.medicalClearance = true;
      confidence += 10;
      break;
    }
  }

  data.confidence = Math.min(confidence, 100);
  return data;
}

async function autoImportDiver(data, db) {
  try {
    // Check for duplicates
    const existingDivers = await db.all('SELECT * FROM divers WHERE email = ? OR phone = ? OR whatsapp_id = ?', 
      [data.email, data.phone, data.whatsappId]);
    
    if (existingDivers.length > 0) {
      console.log('Duplicate diver found, skipping import');
      return;
    }

    // Create new diver
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const payload = {
      name: fullName,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      certification_level: data.certification,
      medical_cleared: data.medicalClearance ? 1 : 0,
      notes: `${data.notes || ''}\n\nImported from WhatsApp\nOriginal message: ${data.originalMessage}\nConfidence: ${data.confidence}%\nWhatsApp ID: ${data.whatsappId}`,
      source: 'whatsapp',
      whatsapp_id: data.whatsappId,
      created_at: new Date().toISOString(),
    };

    await db.run(`
      INSERT INTO divers (name, first_name, last_name, email, phone, certification_level, medical_cleared, notes, source, whatsapp_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      payload.name,
      payload.first_name,
      payload.last_name,
      payload.email,
      payload.phone,
      payload.certification_level,
      payload.medical_cleared,
      payload.notes,
      payload.source,
      payload.whatsapp_id,
      payload.created_at
    ]);

    console.log('Successfully imported diver from WhatsApp:', fullName);
    
  } catch (error) {
    console.error('Error auto-importing diver:', error);
  }
}

function generateWhatsAppReply(originalMessage, processedData) {
  if (!processedData) {
    return `Hello! 👋 Thank you for your message. Please provide your:\n• Full name\n• Email address\n• Phone number\n• Diving certification (if any)\n\nWe'll help you get started with your diving adventure! 🤿`;
  }

  if (processedData.confidence >= 75) {
    return `✅ Thank you ${processedData.firstName || 'there'}! Your information has been received and you're now registered in our diving system. 🎉\n\nWe'll contact you soon with more details about our diving programs and upcoming trips. Safe diving! 🤿`;
  } else {
    return `Thank you for your interest in diving! 🤿 We received some of your information, but need a few more details to complete your registration:\n\n• Full name\n• Email address\n• Phone number\n• Diving certification (if any)\n\nPlease reply with these details and we'll get you set up! 📝`;
  }
}

async function sendWhatsAppReply(to, message) {
  try {
    // This would integrate with WhatsApp Business API
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    };

    // Implementation would call WhatsApp Business API
    console.log('Sending WhatsApp reply:', payload);
    
  } catch (error) {
    console.error('Error sending WhatsApp reply:', error);
  }
}

// Helper function to generate click-to-chat links
function generateWhatsAppLink(phone, message = '') {
  const encodedPhone = phone.replace(/[^\d]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${encodedPhone}${message ? '?text=' + encodedMessage : ''}`;
}

module.exports = { router, generateWhatsAppLink };
