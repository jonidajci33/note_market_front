import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, View } from "react-native";

import { AuthInput } from "@/components/ui/AuthInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useRegister } from "@/hooks/useRegister";
import { useAuthStore } from "@/store/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const { register, isLoading, error, clearError } = useRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) {
      router.replace("/welcome");
    }
  }, [hydrated, token]);

  const formError = localError ?? error;

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && confirmPassword.length > 0;
  }, [email, password, confirmPassword]);

  const handleRegister = async () => {
    setLocalError(null);
    clearError();

    const normalizedEmail = email.trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      await register({ email: normalizedEmail, password });
      router.replace("/welcome");
    } catch {
      // Error state is managed by useRegister.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F6F0]">
      <View className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-[#D6EFE0]" />
      <View className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#FFE9CF]" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-center px-6">
        <View className="rounded-3xl bg-white p-6 shadow shadow-slate-200">
          <Text className="text-3xl font-black text-slate-800">Create account</Text>
          <Text className="mt-2 text-sm text-slate-500">Join Note Market and start learning smarter.</Text>

          <View className="mt-7 gap-5">
            <AuthInput
              autoCapitalize="none"
              autoComplete="email"
              helperText="We will use this email for login and updates."
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />

            <AuthInput
              autoCapitalize="none"
              autoComplete="new-password"
              helperText="Use at least 8 characters."
              label="Password"
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              value={password}
            />

            <AuthInput
              autoCapitalize="none"
              autoComplete="new-password"
              helperText="Re-enter your password to confirm."
              label="Confirm password"
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
            />
          </View>

          {formError ? (
            <View className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <Text className="text-sm font-medium text-rose-600">{formError}</Text>
            </View>
          ) : null}

          <PrimaryButton className="mt-7" disabled={!canSubmit} loading={isLoading} onPress={handleRegister} title="Create account" />

          <View className="mt-4 flex-row items-center justify-center">
            <Text className="text-sm text-slate-500">Already have an account?</Text>
            <Pressable className="ml-2" onPress={() => router.replace("/auth/login")}>
              <Text className="text-sm font-semibold text-brand-600">Login</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
