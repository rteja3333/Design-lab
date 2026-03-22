import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CATEGORIES, COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { requestService } from '../../services/database';
import { locationService } from '../../services/location';

export default function AdminCreateRequestScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [tags, setTags] = useState([]);
  const [radius, setRadius] = useState('2000');
  const [targetCount, setTargetCount] = useState('10');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const availableTags = useMemo(() => category?.tags || [], [category]);

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const pickCurrentLocation = async () => {
    const locResult = await locationService.getCurrentLocation();
    if (!locResult.success) {
      Alert.alert('Location Error', locResult.error || 'Unable to get current location');
      return;
    }

    setLocation(locResult.location);
    const addressResult = await locationService.getAddressFromCoordinates(
      locResult.location.latitude,
      locResult.location.longitude
    );
    setAddress(addressResult.success ? addressResult.address : 'Selected location');
  };

  const createRequest = async () => {
    if (!title.trim() || !description.trim() || !category || !location) {
      Alert.alert('Missing details', 'Please add title, description, category and location.');
      return;
    }

    setIsSaving(true);
    const expiresAt = new Date(Date.now() + Number(expiresInHours || 24) * 60 * 60 * 1000);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category.id,
      tags,
      location: location.geoPoint,
      radius: Number(radius || 2000),
      targetCount: Number(targetCount || 10),
      instructions: `Capture clear photo/video evidence for ${category.name} related issue.`,
      expiresAt,
    };

    const result = await requestService.createRequest(payload);
    setIsSaving(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to create request');
      return;
    }

    Alert.alert('Request created', 'Users in selected radius will be notified.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Create Location Request</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Capture pothole damage" />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What exactly should users capture?"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setCategory(item);
                  setTags([]);
                }}
                style={[styles.categoryChip, category?.id === item.id && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, category?.id === item.id && styles.categoryChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {availableTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagsWrap}>
              {availableTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagChip, tags.includes(tag) && styles.tagChipActive]}
                >
                  <Text style={[styles.tagChipText, tags.includes(tag) && styles.tagChipTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity style={styles.locationBtn} onPress={pickCurrentLocation}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.locationText}>{address || 'Use current location as request center'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <Text style={styles.label}>Radius (m)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={radius} onChangeText={setRadius} />
          </View>
          <View style={styles.inlineField}>
            <Text style={styles.label}>Target Reports</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={targetCount} onChangeText={setTargetCount} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Expires In (hours)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={expiresInHours} onChangeText={setExpiresInHours} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryBtn, isSaving && styles.btnDisabled]} onPress={createRequest} disabled={isSaving}>
          <Text style={styles.primaryBtnText}>{isSaving ? 'Creating...' : 'Create Request'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  heading: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  textArea: { minHeight: 100 },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.sm },
  categoryChipTextActive: { color: COLORS.white },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tagChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tagChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  tagChipText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.sm },
  tagChipTextActive: { color: COLORS.white },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  locationText: { marginLeft: SPACING.sm, color: COLORS.primary, flex: 1 },
  inlineRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  inlineField: { flex: 1 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.base },
  btnDisabled: { opacity: 0.7 },
});