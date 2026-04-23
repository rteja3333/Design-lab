import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReportCard from '../../components/ReportCard';
import { Audio } from 'expo-av';
import { authService } from '../../services/auth';
import { reportService } from '../../services/database';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES, ROUTES } from '../../constants/theme';

export default function RequestDetailsScreen({ navigation, route }) {
  const { request } = route.params || {};
  const [linkedReports, setLinkedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef(null);

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No request data available</Text>
      </View>
    );
  }

  const category = CATEGORIES.find(c => c.id === request.category);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'closed': return COLORS.gray500;
      case 'expired': return COLORS.error;
      default: return COLORS.warning;
    }
  };

  const getReportStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'sent_back':
        return COLORS.info;
      default:
        return COLORS.warning;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const progress = request.targetCount > 0
    ? Math.min((request.currentCount || 0) / request.targetCount, 1)
    : 0;

  const locationToGoogleMapsUrl = (location) => {
    if (!location?.latitude || !location?.longitude) return null;
    const { latitude, longitude } = location;
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  const handleNavigateToRequest = () => {
    const url = locationToGoogleMapsUrl(request?.location);
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleReport = () => {
    navigation.navigate(ROUTES.REPORT_CREATE, { request });
  };

  const toggleRequestAudio = async () => {
    if (!request?.audioUrl) return;
    try {
      if (soundRef.current && isPlayingAudio) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlayingAudio(false);
        return;
      }
      setAudioLoading(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: request.audioUrl },
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
    } finally {
      setAudioLoading(false);
    }
  };

  useEffect(() => {
    const loadLinkedReports = async () => {
      if (!request?.id) return;
      const currentUser = authService.getCurrentUser();
      const isAdminOwner = !!(currentUser?.uid && request?.adminId && currentUser.uid === request.adminId);
      if (!isAdminOwner) return;

      setLoadingReports(true);
      try {
        const result = await reportService.getReportsByRequestId(request.id);
        if (result.success) {
          setLinkedReports(result.data);
        }
      } catch (error) {
        console.error('Error loading linked reports:', error);
      } finally {
        setLoadingReports(false);
      }
    };

    loadLinkedReports();
  }, [request?.id, request?.adminId]);

  useEffect(() => () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
  }, []);

  const visibleReports = linkedReports.filter((report) => {
    if (reportFilter === 'all') return true;
    return report.status === reportFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>  
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
            <Text style={[styles.statusLabel, { color: getStatusColor(request.status) }]}>
              {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Unknown'}
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
        <Text style={styles.title}>{request.title || 'Untitled Request'}</Text>

        {/* Description */}
        <Text style={styles.description}>{request.description || 'No description provided.'}</Text>

        {/* Progress */}
        {request.targetCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {request.currentCount || 0} / {request.targetCount} reports submitted
              </Text>
            </View>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailCard}>
            {request.location && (
              <TouchableOpacity style={styles.locationBtn} activeOpacity={0.9} onPress={handleNavigateToRequest}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.detailText}>
                    {`Location: ${request.location.latitude?.toFixed(4)}, ${request.location.longitude?.toFixed(4)}`}
                  </Text>
                </View>
                <View style={styles.navigatePill}>
                  <Ionicons name="navigate-outline" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            )}
            {request.radius > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="radio-outline" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>Radius: {request.radius}m</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailText}>Created: {formatDate(request.createdAt)}</Text>
            </View>
            {request.expiresAt && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={COLORS.warning} />
                <Text style={styles.detailText}>Expires: {formatDate(request.expiresAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tags */}
        {request.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {request.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {request.instructions ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsCard}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
              <Text style={styles.instructionsText}>{request.instructions}</Text>
            </View>
          </View>
        ) : null}

        {request.audioUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requester Voice Note</Text>
            <TouchableOpacity style={styles.audioCard} onPress={toggleRequestAudio}>
              <Ionicons
                name={isPlayingAudio ? 'stop-circle-outline' : 'play-circle-outline'}
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.audioCardText}>
                {audioLoading ? 'Loading audio...' : isPlayingAudio ? 'Stop voice note' : 'Play voice note'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Admin submissions view */}
        {(loadingReports || linkedReports.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Reports</Text>
            {!loadingReports && linkedReports.length > 0 ? (
              <View style={styles.filterRow}>
                {['all', 'pending', 'approved', 'rejected', 'sent_back'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, reportFilter === filter && styles.filterChipActive]}
                    onPress={() => setReportFilter(filter)}
                  >
                    <Text style={[styles.filterChipText, reportFilter === filter && styles.filterChipTextActive]}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {loadingReports ? (
              <View style={styles.loadingReports}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingReportsText}>Loading submissions...</Text>
              </View>
            ) : (
              visibleReports.map((report) => (
                <View key={report.id} style={styles.reportCardWrap}>
                  <ReportCard
                    report={report}
                    onPress={() =>
                      navigation.navigate(ROUTES.REPORT_DETAILS, {
                        report,
                        adminView: true,
                        requestId: request.id,
                        requestAdminId: request.adminId,
                      })
                    }
                    status={{
                      label: report.status?.charAt(0).toUpperCase() + report.status?.slice(1),
                      color: getReportStatusColor(report.status),
                      icon:
                        report.status === 'approved'
                          ? 'checkmark-circle'
                          : report.status === 'rejected'
                            ? 'close-circle'
                            : report.status === 'sent_back'
                              ? 'return-up-back'
                            : 'time',
                    }}
                  />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Report Button */}
      {request.status === 'active' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.white} />
            <Text style={styles.reportButtonText}>Submit a Report</Text>
          </TouchableOpacity>
        </View>
      )}
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
  progressCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    gap: SPACING.md,
    ...SHADOWS.sm,
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
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  instructionsText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  bottomBar: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  reportButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  reportButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
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
  locationBtn: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  navigatePill: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  loadingReports: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  loadingReportsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  reportCardWrap: {
    marginBottom: SPACING.md,
  },
});