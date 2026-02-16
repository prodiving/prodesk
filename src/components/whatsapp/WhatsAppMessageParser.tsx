import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User, Mail, Phone, Award, CheckCircle, AlertTriangle } from 'lucide-react';

interface ParsedDiverData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  certification?: string;
  experience?: string;
  medicalClearance?: boolean;
  notes?: string;
  confidence: number;
}

interface WhatsAppMessageParserProps {
  onImport?: (data: ParsedDiverData) => void;
}

export default function WhatsAppMessageParser({ onImport }: WhatsAppMessageParserProps) {
  const [message, setMessage] = useState('');
  const [parsedData, setParsedData] = useState<ParsedDiverData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseWhatsAppMessage = (text: string): ParsedDiverData => {
    const data: ParsedDiverData = { confidence: 0 };
    let confidence = 0;

    // Name patterns (more comprehensive for WhatsApp)
    const namePatterns = [
      /(?:Hi|Hello|Hey),?\s+(?:I'm|I am|my name is|this is)\s+([a-zA-Z\u4e00-\u9fa5\s]+)/i,
      /(?:我叫|my name is|姓名[:：])\s*([a-zA-Z\u4e00-\u9fa5\s]+)/i,
      /([a-zA-Z\u4e00-\u9fa5]{2,10})\s+(?:here|speaking|writing)/i,
      /^([a-zA-Z\u4e00-\u9fa5]{2,15})\s*$/m, // Single name at start
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
          data.firstName = parts[0];
          data.lastName = parts.slice(1).join(' ');
        } else {
          data.firstName = name;
        }
        confidence += 25;
        break;
      }
    }

    // Email patterns (including common WhatsApp formats)
    const emailPatterns = [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /(?:email|mail)[:：]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /(?:at|@)\s*([a-zA-Z0-9._%+-]+)\s*(dot|\.)\s*([a-zA-Z]{2,})/i,
    ];

    for (const pattern of emailPatterns) {
      const match = text.match(pattern);
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

    // Phone patterns (international format awareness)
    const phonePatterns = [
      /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/, // US format
      /(?:\+?44[-.\s]?)?\(?([0-9]{3,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4})/, // UK format
      /(?:\+?86[-.\s]?)?1[3-9]\d{9}/, // China format
      /\+?\d{10,15}/, // General international
      /(?:phone|mobile|cell|call|whatsapp)[:：]\s*(\+?\d+)/i,
      /(?:my|contact|reach)\s+(?:at|on)\s*(\+?\d+)/i,
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
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

    // Certification patterns (WhatsApp specific)
    const certPatterns = [
      /(?:Not Certified|PADI|SSI|NAUI|CMAS|DSD|Snorkelling)\s+(Open Water|Advanced|Rescue|Divemaster|Instructor|Discover Scuba Diving)/i,
      /(?:certified|certification|cert)[:：]?\s*([a-zA-Z\s]+(?:diver|instructor))/i,
      /(?:I'm|i am)\s+(?:a\s+)?([a-zA-Z\s]+)\s+(?:certified|diver)/i,
      /(?:潜水证|diving\s+cert|not\s+certified)[:：]?\s*([a-zA-Z\s]+)/i,
    ];

    for (const pattern of certPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.certification = match[1] || match[0];
        confidence += 20;
        break;
      }
    }

    // Experience patterns (more conversational)
    const expPatterns = [
      /(?:I've|i have|done)\s+(\d+)\s*(?:dives?|dive)/i,
      /(?:experience|level)[:：]?\s*(\d+)\s*(?:dives?|dive|times)/i,
      /(?:潜水了|diving)\s+(\d+)\s*(?:次|times|dives)/i,
      /(?:beginner|intermediate|advanced|expert|pro)/i,
    ];

    for (const pattern of expPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.experience = match[1] || match[0];
        confidence += 15;
        break;
      }
    }

    // Medical clearance patterns
    const medicalPatterns = [
      /(?:medical|health|fit)[:：]?\s*(clear|cleared|ok|good|fine|yes)/i,
      /(?:no\s+)?(?:medical\s+)?(issues|problems|concerns)/i,
      /(?:fit|healthy|cleared)\s+(?:for|to)\s+(?:dive|scuba)/i,
      /(?:医疗|健康)[:：]?\s*(通过|良好|ok)/i,
    ];

    for (const pattern of medicalPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.medicalClearance = true;
        confidence += 10;
        break;
      }
    }

    data.confidence = Math.min(confidence, 100);
    return data;
  };

  const handleParse = async () => {
    if (!message.trim()) return;

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const parsed = parseWhatsAppMessage(message);
      setParsedData(parsed);
    } catch (error) {
      console.error('Error parsing WhatsApp message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (parsedData && onImport) {
      onImport(parsedData);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 75) return 'default';
    if (confidence >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Message Parser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="message">WhatsApp Message</Label>
            <textarea
              id="message"
              className="w-full p-3 border rounded-md resize-none min-h-[120px]"
              placeholder="Paste WhatsApp message here... Examples:
• 'Hi, I'm John Smith. I'm interested in diving. My email is john@email.com and phone is +1234567890. I have PADI Open Water certification.'
• 'Hello, this is Sarah Johnson. I want to book a dive trip. You can reach me at sarah.j@email.com or +1-555-0123. I'm certified with SSI Advanced.'
• 'Hi there, 张伟 here. I'm from China and want to dive. My WeChat is yourwechatid and I have 15 dives experience.'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleParse} 
            disabled={!message.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Parsing...' : 'Parse WhatsApp Message'}
          </Button>
        </CardContent>
      </Card>

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Parsed Diver Information
              </span>
              <Badge variant={getConfidenceBadge(parsedData.confidence)}>
                {parsedData.confidence}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsedData.firstName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">First Name</Label>
                    <p className="font-medium">{parsedData.firstName}</p>
                  </div>
                </div>
              )}
              
              {parsedData.lastName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Name</Label>
                    <p className="font-medium">{parsedData.lastName}</p>
                  </div>
                </div>
              )}
              
              {parsedData.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{parsedData.email}</p>
                  </div>
                </div>
              )}
              
              {parsedData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone/WhatsApp</Label>
                    <p className="font-medium">{parsedData.phone}</p>
                  </div>
                </div>
              )}
              
              {parsedData.certification && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Certification</Label>
                    <p className="font-medium">{parsedData.certification}</p>
                  </div>
                </div>
              )}
              
              {parsedData.experience && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Experience</Label>
                    <p className="font-medium">{parsedData.experience}</p>
                  </div>
                </div>
              )}
            </div>

            {parsedData.medicalClearance !== undefined && (
              <div className="flex items-center gap-2">
                {parsedData.medicalClearance ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Medical Clearance</Label>
                  <p className="font-medium">
                    {parsedData.medicalClearance ? 'Cleared' : 'Not specified'}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className={`text-sm ${getConfidenceColor(parsedData.confidence)}`}>
                {parsedData.confidence >= 75 && '✓ High confidence - Ready to import'}
                {parsedData.confidence >= 50 && parsedData.confidence < 75 && '⚠ Medium confidence - Review before import'}
                {parsedData.confidence < 50 && '✗ Low confidence - Manual review required'}
              </div>
              
              <Button onClick={handleImport} disabled={parsedData.confidence < 50}>
                Import to Diver Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
