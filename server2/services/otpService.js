const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
// Add this function before your OTP endpoints
const isValidPhoneNumber = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Check for valid Indian phone number patterns:
  // 10 digits: 9509836356
  // 12 digits with country code: 919509836356
  // 13 digits with + and country code: +919509836356
  return (
    cleaned.length === 10 ||
    (cleaned.length === 12 && cleaned.startsWith("91")) ||
    (cleaned.length === 13 && cleaned.startsWith("91"))
  );
};

const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, "");

  // Add India country code if missing
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }

  return "+" + cleaned;
};

class OTPService {
  async sendEmailOTP(email) {
    try {
      console.log(`📧 Sending email OTP to: ${email}`);

      const { data, error } = await supabaseAnon.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("Supabase Email OTP error:", error);
        throw error;
      }

      console.log(`✅ Email OTP sent successfully to ${email}`);
      return {
        success: true,
        message: "OTP sent to your email",
      };
    } catch (error) {
      console.error("Error sending email OTP:", error);
      throw new Error(`Failed to send email OTP: ${error.message}`);
    }
  }

  async sendPhoneOTP(phoneNumber) {
    try {
      // For development, throw a helpful error
      if (process.env.NODE_ENV !== "production") {
        throw new Error(
          "Phone OTP is not available in development mode. Please use email authentication."
        );
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log(`📱 Sending SMS OTP to: ${formattedPhone}`);

      const { data, error } = await supabaseAnon.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: "sms",
        },
      });

      if (error) {
        console.error("Supabase SMS OTP error:", error);
        throw error;
      }

      console.log(`✅ SMS OTP sent successfully to ${formattedPhone}`);
      return {
        success: true,
        message: "OTP sent to your phone",
      };
    } catch (error) {
      console.error("Error sending phone OTP:", error);
      throw new Error(`Failed to send SMS OTP: ${error.message}`);
    }
  }

  async verifyOTP(phoneOrEmail, otpCode) {
    try {
      console.log(`🔐 Verifying OTP for: ${phoneOrEmail}`);

      let verifyData;

      if (this.isEmail(phoneOrEmail)) {
        verifyData = await supabaseAnon.auth.verifyOtp({
          email: phoneOrEmail,
          token: otpCode,
          type: "email",
        });
      } else {
        const formattedPhone = this.formatPhoneNumber(phoneOrEmail);
        verifyData = await supabaseAnon.auth.verifyOtp({
          phone: formattedPhone,
          token: otpCode,
          type: "sms",
        });
      }

      const { data, error } = verifyData;

      if (error) {
        console.error("OTP verification error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("Invalid OTP or OTP expired");
      }

      const userProfile = await this.createOrUpdateUserProfile(data.user);

      console.log(`✅ OTP verified successfully for user: ${data.user.id}`);
      return {
        success: true,
        user: userProfile,
        session: data.session,
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw new Error(`OTP verification failed: ${error.message}`);
    }
  }

  async createOrUpdateUserProfile(authUser) {
    try {
      const userData = {
        id: authUser.id,
        email: authUser.email,
        phone_number: authUser.phone,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      let userProfile;
      if (existingUser) {
        const { data, error } = await supabase
          .from("users")
          .update(userData)
          .eq("id", authUser.id)
          .select()
          .single();

        if (error) throw error;
        userProfile = data;
      } else {
        userData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("users")
          .insert([userData])
          .select()
          .single();

        if (error) throw error;
        userProfile = data;
      }

      return userProfile;
    } catch (error) {
      console.error("Error creating/updating user profile:", error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    }

    return "+" + cleaned;
  }

  isEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  isPhoneNumber(input) {
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return phoneRegex.test(input.replace(/\s/g, ""));
  }
}

module.exports = new OTPService();
