const crypto = require('crypto');
const express = require('express');
const router = express.Router();

// WeChat webhook endpoint
router.post('/wechat/webhook', async (req, res) => {
  try {
    const { signature, timestamp, nonce, echostr } = req.query;
    
    // WeChat verification (for initial setup)
    if (echostr) {
      const token = process.env.WECHAT_TOKEN || 'your_wechat_token';
      const hash = crypto
        .createHash('sha1')
        .update([token, timestamp, nonce].sort().join(''))
        .digest('hex');
      
      if (hash === signature) {
        return res.status(200).send(echostr);
      } else {
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    // Parse WeChat message
    const message = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'No message received' });
    }

    // Process different message types
    let processedData = null;
    
    switch (message.MsgType) {
      case 'text':
        processedData = processTextMessage(message);
        break;
      case 'event':
        processedData = await processEventMessage(message);
        break;
      default:
        console.log('Unhandled message type:', message.MsgType);
    }

    // Auto-import if enabled and confidence is high
    if (processedData && processedData.confidence >= 70) {
      await autoImportDiver(processedData, req.db);
    }

    // Send response to WeChat
    const replyMessage = generateReplyMessage(message, processedData);
    
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(replyMessage);
    
  } catch (error) {
    console.error('WeChat webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function processTextMessage(message) {
  const content = message.Content || '';
  const data = {
    confidence: 0,
    source: 'wechat',
    originalMessage: content,
    wechatId: message.FromUserName,
  };

  let confidence = 0;

  // Name patterns (Chinese and English)
  const namePatterns = [
    /(?:我叫|my name is|姓名[:：])\s*([a-zA-Z\u4e00-\u9fa5\s]+)/i,
    /([a-zA-Z\u4e00-\u9fa5]{2,10})(?:\s+is|\s+am)?/,
  ];

  for (const pattern of namePatterns) {
    const match = content.match(pattern);
    if (match) {
      const name = match[1].trim();
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        data.firstName = parts[0];
        data.lastName = parts.slice(1).join(' ');
      } else {
        data.firstName = name;
      }
      confidence += 20;
      break;
    }
  }

  // Email patterns
  const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    data.email = emailMatch[1];
    confidence += 25;
  }

  // Phone patterns
  const phonePatterns = [
    /1[3-9]\d{9}/, // Chinese mobile
    /\+?\d{10,15}/, // International
    /(?:电话|phone|手机)[:：]\s*(\+?\d+)/i,
  ];

  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.phone = match[1] || match[0];
      confidence += 20;
      break;
    }
  }

  // Certification patterns
  const certPatterns = [
    /(?:Not Certified|PADI|SSI|NAUI|CMAS|DSD|Snorkelling)\s+(Open Water|Advanced|Rescue|Divemaster|Instructor|Discover Scuba Diving)/i,
    /(?:证书|certification)[:：]\s*([a-zA-Z\s]+)/i,
    /(?:潜水证|diving\s+cert|not\s+certified)/i,
  ];

  for (const pattern of certPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.certification = match[1] || match[0];
      confidence += 20;
      break;
    }
  }

  // Experience patterns
  const expPatterns = [
    /(\d+)\s*(?:次|dives?|dive)/i,
    /(?:经验|experience)[:：]\s*(.+)/i,
    /(?:潜水了|have\s+dived)\s*(\d+)/i,
  ];

  for (const pattern of expPatterns) {
    const match = content.match(pattern);
    if (match) {
      data.experience = match[1] || match[0];
      confidence += 15;
      break;
    }
  }

  data.confidence = Math.min(confidence, 100);
  return data;
}

async function processEventMessage(message) {
  switch (message.Event) {
    case 'subscribe':
      // User followed the account
      return {
        confidence: 10,
        source: 'wechat',
        originalMessage: `User subscribed: ${message.EventKey}`,
        wechatId: message.FromUserName,
        notes: 'New follower via WeChat',
      };
    
    case 'CLICK':
      // User clicked menu button
      if (message.EventKey === 'REGISTER_DIVER') {
        return {
          confidence: 50,
          source: 'wechat',
          originalMessage: 'User clicked registration button',
          wechatId: message.FromUserName,
          notes: 'Initiated registration via menu',
        };
      }
      break;
    
    default:
      return null;
  }
  
  return null;
}

async function autoImportDiver(data, db) {
  try {
    // Check for duplicates
    const existingDivers = await db.all('SELECT * FROM divers WHERE email = ? OR phone = ?', [data.email, data.phone]);
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
      notes: `${data.notes || ''}\n\nImported from WeChat\nOriginal message: ${data.originalMessage}\nConfidence: ${data.confidence}%`,
      source: 'wechat',
      wechat_id: data.wechatId,
    };

    await db.run(`
      INSERT INTO divers (name, first_name, last_name, email, phone, certification_level, medical_cleared, notes, source, wechat_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
      payload.wechat_id
    ]);

    console.log('Successfully imported diver from WeChat:', fullName);
    
  } catch (error) {
    console.error('Error auto-importing diver:', error);
  }
}

function generateReplyMessage(originalMessage, processedData) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  if (!processedData) {
    return `
      <xml>
        <ToUserName><![CDATA[${originalMessage.FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${originalMessage.ToUserName}]]></FromUserName>
        <CreateTime>${timestamp}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[Thank you for your message! Please provide your name, email, and phone number to register as a diver.]]></Content>
      </xml>
    `;
  }

  if (processedData.confidence >= 70) {
    return `
      <xml>
        <ToUserName><![CDATA[${originalMessage.FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${originalMessage.ToUserName}]]></FromUserName>
        <CreateTime>${timestamp}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[✅ Thank you! Your information has been received and you're now registered in our diving system. We'll contact you soon with more details about our diving programs.]]></Content>
      </xml>
    `;
  } else {
    return `
      <xml>
        <ToUserName><![CDATA[${originalMessage.FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${originalMessage.ToUserName}]]></FromUserName>
        <CreateTime>${timestamp}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[Thank you for your interest! We received some of your information, but need more details to complete your registration. Please provide:\n• Full name\n• Email address\n• Phone number\n• Diving certification (if any)]]></Content>
      </xml>
    `;
  }
}

// Helper function to set up WeChat menu
async function setupWeChatMenu() {
  const menu = {
    button: [
      {
        type: "click",
        name: "Register as Diver",
        key: "REGISTER_DIVER"
      },
      {
        name: "Services",
        sub_button: [
          {
            type: "view",
            name: "Book Trip",
            url: "https://your-dive-site.com/book"
          },
          {
            type: "view",
            name: "View Courses",
            url: "https://your-dive-site.com/courses"
          }
        ]
      },
      {
        type: "click",
        name: "Contact Us",
        key: "CONTACT_US"
      }
    ]
  };

  // Implementation would involve calling WeChat API to set menu
  console.log('WeChat menu setup:', menu);
}

module.exports = router;
