import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

export interface SelectOption<T extends string> {
  key: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
  color?: string;
}

interface Props<T extends string> {
  options: SelectOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
  label?: string;
}

export default function FilterSelect<T extends string>({ options, selected, onSelect, label }: Props<T>) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.key === selected);

  const handleSelect = useCallback(
    (key: T) => {
      Haptics.selectionAsync();
      onSelect(key);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen((o) => !o);
        }}
      >
        <View style={styles.triggerContent}>
          {selectedOption?.icon && (
            <Ionicons name={selectedOption.icon} size={15} color={selectedOption?.color || Colors.light.primary} />
          )}
          <Text style={[styles.triggerText, selectedOption?.color ? { color: selectedOption.color } : undefined]}>
            {selectedOption?.label || selected}
          </Text>
          {selectedOption?.count !== undefined && (
            <View style={[styles.countBadge, { backgroundColor: (selectedOption?.color || Colors.light.primary) + "18" }]}>
              <Text style={[styles.countText, { color: selectedOption?.color || Colors.light.primary }]}>
                {selectedOption.count}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={Colors.light.textTertiary} />
      </Pressable>

      {open && (
        <View style={styles.dropdown}>
          {options.map((opt) => {
            const isSelected = opt.key === selected;
            return (
              <Pressable
                key={opt.key}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(opt.key)}
              >
                <View style={styles.optionContent}>
                  {opt.icon && (
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? opt.color || Colors.light.primary : Colors.light.textTertiary}
                    />
                  )}
                  <Text style={[styles.optionLabel, isSelected && { fontWeight: "700", color: opt.color || Colors.light.primary }]}>
                    {opt.label}
                  </Text>
                  {opt.count !== undefined && (
                    <Text style={[styles.optionCount, { color: isSelected ? opt.color || Colors.light.primary : Colors.light.textTertiary }]}>
                      {opt.count}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={opt.color || Colors.light.primary} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 10 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 2,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  triggerOpen: {
    borderColor: Colors.light.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  optionSelected: {
    backgroundColor: Colors.light.backgroundElement,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  optionCount: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
});
