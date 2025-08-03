import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Mail, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/config/api';

interface OTPLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

const OTPLoginDialog = ({ open, onClose, onLoginSuccess }: OTPLoginDialogProps) => {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [contactInfo, setContactInfo] = useState('');
  const [contactType, setContactType] = useState<'auto' | 'phone' | 'email'>('auto');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [maskedContact, setMaskedContact] = useState('');
  const { toast } = useToast();
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resetForm = () => {
    setStep('input');
    setContactInfo('');
    setOtp(['', '', '', '', '', '']);
    setCountdown(0);
    setMaskedContact('');
  };

  const isValidContact = (contact: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return emailRegex.test(contact) || phoneRegex.test(contact.replace(/\s/g, ''));
  };

  const handleSendOTP = async () => {
    if (!contactInfo.trim() || !isValidContact(contactInfo)) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid email or phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/send-otp', {
        phoneOrEmail: contactInfo.trim(),
        method: contactType
      });

      if (response.data.success) {
        setStep('verify');
        setMaskedContact(response.data.contactInfo.masked);
        setCountdown(300);
        
        toast({
          title: "OTP sent",
          description: `Verification code sent to ${response.data.contactInfo.masked}`,
        });

        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      const errorMessage = error.response?.data?.error || "Please try again";
      
      // Show helpful messages for common errors
      if (errorMessage.includes('SMS') || errorMessage.includes('phone')) {
        toast({
          title: "Phone OTP not available",
          description: "Please use email authentication instead. SMS service is not configured for development.",
          variant: "destructive",
        });
        // Auto-switch to email mode
        setContactType('email');
      } else {
        toast({
          title: "Failed to send OTP",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        phoneOrEmail: contactInfo,
        otp: otpToVerify
      });

      if (response.data.success) {
        toast({
          title: "Login successful",
          description: "Welcome to Jhankari!",
        });

        onLoginSuccess(response.data.user);
        onClose();
        resetForm();
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: "Invalid OTP",
        description: error.response?.data?.error || "Please check your code and try again",
        variant: "destructive",
      });
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };
  // Add phone number formatting
  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.post('/auth/resend-otp', {
        phoneOrEmail: contactInfo
      });

      if (response.data.success) {
        setCountdown(300); // Reset countdown
        toast({
          title: "OTP resent",
          description: "A new verification code has been sent",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to resend OTP",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'verify' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep('input')}
                className="h-6 w-6"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === 'input' ? 'Login to Jhankari' : 'Verify OTP'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' 
              ? 'Enter your phone number or email to receive a verification code'
              : 'Enter the verification code sent to your device'
            }
          </DialogDescription>
        </DialogHeader>
        {step === 'input' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Phone Number or Email</Label>
                <Input
                  id="contact"
                  placeholder={contactType === 'phone' ? "Enter 10-digit phone number (e.g., 9509836356)" : "Enter your email address"}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  disabled={loading}
                />
                {contactType === 'phone' && (
                  <p className="text-xs text-muted-foreground">
                    Note: Phone OTP is not available in development mode. Please use email instead.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={contactType === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContactType('phone')}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  SMS
                </Button>
                <Button
                  type="button"
                  variant={contactType === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContactType('email')}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={loading || !contactInfo.trim()}
              className="w-full"
              variant="royal"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>We'll send you a verification code for secure login</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to
              </p>
              <p className="font-medium">{maskedContact}</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-bold"
                    disabled={loading}
                  />
                ))}
              </div>

              {countdown > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  Code expires in {formatCountdown(countdown)}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleVerifyOTP()}
                disabled={loading || otp.some(digit => !digit)}
                className="w-full"
                variant="royal"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button
                onClick={handleResendOTP}
                disabled={resendLoading || countdown > 0}
                variant="outline"
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OTPLoginDialog;
