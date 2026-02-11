import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, View } from "react-native";

import { AuthInput } from "@/components/ui/AuthInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLogin } from "@/hooks/useLogin";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const { login, isLoading, error, clearError } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) {
      router.replace("/welcome");
    }
  }, [hydrated, token]);

  const formError = localError ?? error;

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0;
  }, [email, password]);

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    if (!canSubmit) {
      setLocalError("Please enter both email and password.");
      return;
    }

    try {
      await login({ email, password });
      router.replace("/welcome");
    } catch {
      // Error state is exposed by useLogin.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F6F0]">
      <View className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-[#D6EFE0]" />
      <View className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#FFE9CF]" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-center px-6">
        <View className="rounded-3xl bg-white p-6 shadow shadow-slate-200">
          <Text className="text-3xl font-black text-slate-800">Welcome back</Text>
          <Text className="mt-2 text-sm text-slate-500">Sign in to continue your learning path.</Text>

          <View className="mt-7 gap-5">
            <AuthInput
              autoCapitalize="none"
              autoComplete="email"
              helperText="Use the email connected to your account."
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />

            <AuthInput
              autoCapitalize="none"
              autoComplete="password"
              helperText="Minimum 8 characters recommended."
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
            />
          </View>

          {formError ? (
            <View className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <Text className="text-sm font-medium text-rose-600">{formError}</Text>
            </View>
          ) : null}

          <PrimaryButton className="mt-7" disabled={!canSubmit} loading={isLoading} onPress={handleLogin} title="Login" />

          <View className="mt-4 flex-row items-center justify-center">
            <Text className="text-sm text-slate-500">New here?</Text>
            <Pressable className="ml-2" onPress={() => router.replace("/auth/register")}>
              <Text className="text-sm font-semibold text-brand-600">Create account</Text>
            </Pressable>
          </View>

          <Text className="mt-3 text-center text-xs text-slate-400">Your account stays secure and encrypted.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
