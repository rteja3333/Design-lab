import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { locationService } from '../../services/location';
import { reportService } from '../../services/database';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES, ROUTES } from '../../constants/theme';

export default function ReportCreateScreen({ navigation, route }) {
  const { selectedCategory, request, captureResult } = route.params || {};

  // Pre-fill category from request if available
  const initialCategory = request
    ? CATEGORIES.find(c => c.id === request.category) || selectedCategory || null
    : selectedCategory || null;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [capturedImages, setCapturedImages] = useState([]);

  // Pick up image returned from CameraScreen
  useEffect(() => {
    if (captureResult?.imageUri) {
      setCapturedImages(prev => {
        if (prev.some(img => img === captureResult.imageUri)) return prev;
        return [...prev, captureResult.imageUri];
      });
    }
  }, [captureResult]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.id,
        tags,
        images: capturedImages,
        videos: [],
        location: location?.geoPoint || null,
        address,
        ...(request?.id ? { requestId: request.id } : {}),
      };

      const result = await reportService.createReport(payload);
      if (!result.success) {
        Alert.alert(
          'Submission failed',
          result.error || 'Unable to submit now. Please check your connection and try again.'
        );
        return;
      }

      if (result.queued) {
        Alert.alert(
          'Saved Offline',
          'Your report is saved on device and will be synced when internet is available.',
          [
            {
              text: 'OK',
              onPress: () => navigation.popToTop()
            }
          ]
        );
        return;
      }

      Alert.alert(
        'Success!',
        'Your report has been submitted successfully. Thank you for helping improve the community!',
        [
          {
            text: 'OK',
            onPress: () => navigation.popToTop()
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    const loc = await locationService.getCurrentLocation();
    if (!loc.success) {
      Alert.alert('Location Error', loc.error || 'Unable to fetch location');
      return;
    }

    setLocation(loc.location);
    const addressResult = await locationService.getAddressFromCoordinates(
      loc.location.latitude,
      loc.location.longitude
    );
    setAddress(addressResult.success ? addressResult.address : 'Current location');
  };

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryCard,
              category?.id === cat.id && styles.categoryCardSelected
            ]}
            onPress={() => setCategory(cat)}
          >
            <Ionicons 
              name={cat.icon} 
              size={24} 
              color={category?.id === cat.id ? COLORS.white : cat.color} 
            />
            <Text style={[
              styles.categoryText,
              category?.id === cat.id && styles.categoryTextSelected
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTagSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tags</Text>
      {category && (
        <View style={styles.tagsContainer}>
          {category.tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagCard,
                tags.includes(tag) && styles.tagCardSelected
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[
                styles.tagText,
                tags.includes(tag) && styles.tagTextSelected
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Brief description of the issue"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        {/* Category Selector */}
        {renderCategorySelector()}

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Provide detailed information about the issue..."
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Tag Selector */}
        {renderTagSelector()}

        {/* Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos & Videos</Text>
          {capturedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
              {capturedImages.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setCapturedImages(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={22} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={() => navigation.navigate(ROUTES.CAMERA, { request })}
          >
            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            <Text style={styles.mediaButtonText}>Add Photos/Videos</Text>
          </TouchableOpacity>
        </View>

        {/* Location Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.locationButtonText}>
              {address ? address : 'Use Current Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        {category && (
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>
              <Ionicons name="information-circle-outline" size={16} />
              {' '}Photo/Video Guidelines
            </Text>
            <Text style={styles.instructionsText}>
              <Text style={styles.boldText}>Photos: </Text>
              {category.instructions.photo}
            </Text>
            <Text style={styles.instructionsText}>
              <Text style={styles.boldText}>Videos: </Text>
              {category.instructions.video}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!title.trim() || !description.trim() || !category) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || !description.trim() || !category || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  categoryCard: {
    alignItems: 'center',
    padding: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    minWidth: 100,
  },
  categoryCardSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  tagCardSelected: {
    backgroundColor: COLORS.secondary,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  tagTextSelected: {
    color: COLORS.white,
  },
  imagePreviewRow: {
    marginBottom: SPACING.md,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray200,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.white,
    borderRadius: 11,
  },
  mediaButton: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  mediaButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: SPACING.sm,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  locationButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  instructionsSection: {
    backgroundColor: COLORS.info + '10',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  instructionsTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: SPACING.md,
  },
  instructionsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  boldText: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  submitSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});