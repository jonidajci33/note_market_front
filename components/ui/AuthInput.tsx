import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

type AuthInputProps = TextInputProps & {
  label: string;
  helperText?: string;
  errorText?: string;
};

export function AuthInput({ label, helperText, errorText, className = "", ...props }: AuthInputProps) {
  const hasError = Boolean(errorText);

  return (
    <View className="w-full gap-2">
      <Text className="px-1 text-sm font-semibold text-slate-600">{label}</Text>
      <TextInput
        className={`h-14 w-full rounded-2xl border px-4 text-base text-slate-900 ${
          hasError ? "border-rose-300 bg-rose-50" : "border-emerald-100 bg-white"
        } ${className}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {helperText ? <Text className="px-1 text-xs text-slate-500">{helperText}</Text> : null}
      {errorText ? <Text className="px-1 text-xs font-semibold text-rose-500">{errorText}</Text> : null}
    </View>
  );
}
