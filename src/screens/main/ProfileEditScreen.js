import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/auth';
import { userService } from '../../services/database';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function ProfileEditScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    city: '',
    state: '',
    bio: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        const result = await userService.getUser(currentUser.uid);
        if (result.success) {
          setForm({
            displayName: result.data.displayName || '',
            email: result.data.email || '',
            city: result.data.city || '',
            state: result.data.state || '',
            bio: result.data.bio || '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile for edit:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    setSaving(true);
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'User session not found.');
        return;
      }
      const payload = {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        bio: form.bio.trim(),
      };
      const result = await userService.updateUser(currentUser.uid, payload);
      if (!result.success) {
        Alert.alert('Update Failed', result.error || 'Could not update profile.');
        return;
      }
      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Update Failed', error?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={form.displayName}
              onChangeText={(v) => updateField('displayName', v)}
              placeholder="Your name"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(v) => updateField('city', v)}
              placeholder="City"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={form.state}
              onChangeText={(v) => updateField('state', v)}
              placeholder="State"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.bio}
              onChangeText={(v) => updateField('bio', v)}
              placeholder="Tell us about yourself"
              multiline
              textAlignVertical="top"
              maxLength={180}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveText}>Save Profile</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboard: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  content: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  textArea: { minHeight: 90 },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    paddingVertical: SPACING.sm + 2,
  },
});
