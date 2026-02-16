import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, User, Mail, Phone, Award, CheckCircle, AlertTriangle } from 'lucide-react';

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

interface WeChatMessageParserProps {
  onImport?: (data: ParsedDiverData) => void;
}

export default function WeChatMessageParser({ onImport }: WeChatMessageParserProps) {
  const [message, setMessage] = useState('');
  const [parsedData, setParsedData] = useState<ParsedDiverData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseWeChatMessage = (text: string): ParsedDiverData => {
    const data: ParsedDiverData = { confidence: 0 };
    let confidence = 0;

    // Name patterns (Chinese and English)
    const namePatterns = [
      /(?:我叫|my name is|姓名[:：])\s*([a-zA-Z\u4e00-\u9fa5\s]+)/i,
      /([a-zA-Z\u4e00-\u9fa5]{2,10})(?:\s+is|\s+am)?/,
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
        confidence += 20;
        break;
      }
    }

    // Email patterns
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      data.email = emailMatch[1];
      confidence += 25;
    }

    // Phone patterns (Chinese and international)
    const phonePatterns = [
      /1[3-9]\d{9}/, // Chinese mobile
      /\+?\d{10,15}/, // International
      /(?:电话|phone|手机)[:：]\s*(\+?\d+)/i,
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
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
      const match = text.match(pattern);
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
      const match = text.match(pattern);
      if (match) {
        data.experience = match[1] || match[0];
        confidence += 15;
        break;
      }
    }

    // Medical clearance patterns
    const medicalPatterns = [
      /(?:医疗|medical)[:：]\s*(clear|cleared|ok|good|通过)/i,
      /(?:健康|health)[:：]\s*(good|ok|良好)/i,
      /no\s+medical\s+issues/i,
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
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const parsed = parseWeChatMessage(message);
      setParsedData(parsed);
    } catch (error) {
      console.error('Error parsing message:', error);
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
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 70) return 'default';
    if (confidence >= 40) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WeChat Message Parser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="message">WeChat Message</Label>
            <textarea
              id="message"
              className="w-full p-3 border rounded-md resize-none min-h-[120px]"
              placeholder="Paste WeChat message here... Example: 'Hi, my name is John Smith. I'm interested in diving. My email is john@email.com and phone is +1234567890. I have PADI Open Water certification.'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleParse} 
            disabled={!message.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Parsing...' : 'Parse Message'}
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
                    <Label className="text-xs text-muted-foreground">Phone</Label>
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
                {parsedData.confidence >= 70 && '✓ High confidence - Ready to import'}
                {parsedData.confidence >= 40 && parsedData.confidence < 70 && '⚠ Medium confidence - Review before import'}
                {parsedData.confidence < 40 && '✗ Low confidence - Manual review required'}
              </div>
              
              <Button onClick={handleImport} disabled={parsedData.confidence < 40}>
                Import to Diver Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
