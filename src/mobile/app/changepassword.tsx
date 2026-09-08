import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useThemeContext } from "@/hooks/use-theme-context";
import SnackBar from "@/components/snackbar";
import { authenticatedFetchApi } from "@/services/apiClient";

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeContext();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      SnackBar.Error("All fields are required.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      SnackBar.Error("New password and confirmation do not match.");
      return false;
    }
    if (newPassword.length < 6) {
      SnackBar.Error("New password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const response = await authenticatedFetchApi("/users/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const message =
        responseJson?.message ??
        responseJson?.Message ??
        "Unable to change password.";

      if (response.ok && success) {
        SnackBar.Success("Password updated.");
        router.back();
      } else {
        SnackBar.Error(message);
      }
    } catch (error) {
      console.error("Change password error:", error);
      SnackBar.Error("Unable to change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Change Password
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View>
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Current password
          </Text>
          <TextInput
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: "transparent",
              },
            ]}
            placeholder="Current password"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View>
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            New password
          </Text>
          <TextInput
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: "transparent",
              },
            ]}
            placeholder="New password"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View>
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Confirm password
          </Text>
          <TextInput
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: "transparent",
              },
            ]}
            placeholder="Confirm password"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.cancel,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.save, { backgroundColor: colors.accent }]}
            onPress={handleUpdate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  cancel: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "700" },
  save: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
