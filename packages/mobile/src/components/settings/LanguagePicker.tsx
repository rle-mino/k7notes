import React from "react";
import { StyleSheet, View, Modal, Text, TouchableOpacity } from "react-native";
import { Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@k7notes/contracts";
import { colors, typography, spacing, radius } from "@/theme";

interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: string | null;
  onSelect: (value: string | null) => void;
  showUseAppLanguage?: boolean;
  title: string;
}

export function LanguagePicker({
  visible,
  onClose,
  currentValue,
  onSelect,
  showUseAppLanguage,
  title,
}: LanguagePickerProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          {showUseAppLanguage && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => onSelect(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionLabel}>{t("settings.useAppLanguage")}</Text>
              {currentValue === null && (
                <Check size={18} color={colors.accent} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          )}

          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={styles.option}
              onPress={() => onSelect(lang)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionLabel}>{t(`languages.${lang}`)}</Text>
              {currentValue === lang && (
                <Check size={18} color={colors.accent} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 340,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionLabel: {
    ...typography.body,
  },
  cancelButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  cancelButtonText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
