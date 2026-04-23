import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Linking, Platform, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { authService } from '../../services/auth';
import { reportService } from '../../services/database';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES } from '../../constants/theme';

export default function ReportDetailsScreen({ route }) {
  const { report, adminView = false, requestAdminId } = route.params || {};
  const [activePhotoUri, setActivePhotoUri] = useState(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(report?.status || 'pending');
  const [reviewFeedback, setReviewFeedback] = useState(report?.adminFeedback || '');
  const [reviewSaving, setReviewSaving] = useState(false);
  const soundRef = useRef(null);

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No report data available</Text>
      </View>
    );
  }

  const category = CATEGORIES.find(c => c.id === report.category);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      case 'sent_back': return COLORS.info;
      case 'pending':
      default: return COLORS.warning;
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'sent_back') return 'Sent Back';
    return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const locationToGoogleMapsUrl = (location) => {
    if (!location?.latitude || !location?.longitude) return null;
    const { latitude, longitude } = location;
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  const handleNavigateToReport = () => {
    if (!report?.location) return;
    const url = locationToGoogleMapsUrl(report.location);
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleToggleAudio = async () => {
    if (!report?.audioUrl) return;
    try {
      if (soundRef.current && isPlayingAudio) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlayingAudio(false);
        return;
      }
      setSoundLoading(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: report.audioUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlayingAudio(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlayingAudio(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      setIsPlayingAudio(false);
    } finally {
      setSoundLoading(false);
    }
  };

  useEffect(() => () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
  }, []);

  const photoUris = useMemo(() => report?.images || [], [report?.images]);
  const canAdminReview = (() => {
    if (!adminView) return false;
    const currentUser = authService.getCurrentUser();
    if (!currentUser?.uid || !requestAdminId) return false;
    return currentUser.uid === requestAdminId;
  })();

  const handleReviewAction = async (status) => {
    if (!report?.id) return;
    const feedback = reviewFeedback.trim();

    if ((status === 'rejected' || status === 'sent_back') && !feedback) {
      Alert.alert('Feedback required', 'Please add feedback so the user understands what to fix.');
      return;
    }

    try {
      setReviewSaving(true);
      const result = await reportService.reviewReport(report.id, {
        status,
        feedback,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update report status');
      }

      setReviewStatus(status);
      Alert.alert('Updated', `Report marked as ${getStatusLabel(status)}.`);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to review report.');
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status + Category */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reviewStatus) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(reviewStatus) }]} />
            <Text style={[styles.statusLabel, { color: getStatusColor(reviewStatus) }]}>
              {getStatusLabel(reviewStatus)}
            </Text>
          </View>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '15' }]}>
              <Ionicons name={category.icon} size={14} color={category.color} />
              <Text style={[styles.categoryLabel, { color: category.color }]}>{category.name}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{report.title || 'Untitled Report'}</Text>

        {/* Description */}
        <Text style={styles.description}>{report.description || 'No description provided.'}</Text>

        {/* Images */}
        {photoUris.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photoUris.map((uri, index) => (
                <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => setActivePhotoUri(uri)}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {report.audioUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Note</Text>
            <TouchableOpacity style={styles.audioCard} onPress={handleToggleAudio} activeOpacity={0.9}>
              <Ionicons
                name={isPlayingAudio ? 'stop-circle-outline' : 'play-circle-outline'}
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.audioCardText}>
                {soundLoading ? 'Loading audio...' : isPlayingAudio ? 'Stop voice note' : 'Play voice note'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailCard}>
            <>
              {report.address ? (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.detailText}>{report.address}</Text>
                </View>
              ) : null}
              {report.location ? (
                <>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.detailText}>
                      {report.location.latitude?.toFixed(4)}, {report.location.longitude?.toFixed(4)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigateToReport}>
                    <Ionicons name="navigate-outline" size={18} color={COLORS.white} />
                    <Text style={styles.navigateBtnText}>Navigate</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailText}>Created: {formatDate(report.createdAt)}</Text>
            </View>
            {report.requestId && (
              <View style={styles.detailRow}>
                <Ionicons name="link-outline" size={18} color={COLORS.secondary} />
                <Text style={styles.detailText}>Linked to request</Text>
              </View>
            )}
          </View>
        </View>

        {(report.adminFeedback || reviewFeedback) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Feedback</Text>
            <View style={styles.feedbackCard}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={COLORS.info} />
              <Text style={styles.feedbackText}>{reviewFeedback || report.adminFeedback}</Text>
            </View>
          </View>
        ) : null}

        {canAdminReview ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Review</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Feedback (required for decline/send back)</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Explain what is wrong or what needs to be recaptured..."
                placeholderTextColor={COLORS.textLight}
                value={reviewFeedback}
                onChangeText={setReviewFeedback}
                multiline
                textAlignVertical="top"
                editable={!reviewSaving}
              />
              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={[styles.reviewButton, styles.approveButton]}
                  onPress={() => handleReviewAction('approved')}
                  disabled={reviewSaving}
                >
                  <Text style={styles.reviewButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reviewButton, styles.sendBackButton]}
                  onPress={() => handleReviewAction('sent_back')}
                  disabled={reviewSaving}
                >
                  <Text style={styles.reviewButtonText}>Send Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reviewButton, styles.rejectButton]}
                  onPress={() => handleReviewAction('rejected')}
                  disabled={reviewSaving}
                >
                  <Text style={styles.reviewButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Tags */}
        {report.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {report.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Photo viewer modal */}
      <Modal
        visible={!!activePhotoUri}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePhotoUri(null)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActivePhotoUri(null)}>
          <View style={styles.modalInner}>
            {activePhotoUri ? (
              <Image source={{ uri: activePhotoUri }} style={styles.modalImage} resizeMode="contain" />
            ) : null}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActivePhotoUri(null)} activeOpacity={0.9}>
              <Ionicons name={Platform.OS === 'ios' ? 'close' : 'close'} size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  imageThumb: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.gray200,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: SPACING.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigateBtn: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 1,
  },
  navigateBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  audioCardText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.info + '12',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  feedbackText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  reviewLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  feedbackInput: {
    minHeight: 90,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  reviewButton: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  sendBackButton: {
    backgroundColor: COLORS.info,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  reviewButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});