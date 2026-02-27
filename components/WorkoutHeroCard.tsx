import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface WorkoutHeroCardProps {
  title: string;
  subtitle?: string;
  category?: string;
  duration?: number;
  imageUri?: string;
  onPress?: () => void;
}

export default function WorkoutHeroCard({
  title,
  subtitle,
  category,
  duration,
  imageUri,
  onPress,
}: WorkoutHeroCardProps) {
  const content = (
    <View style={styles.overlay}>
      <View style={styles.topRow}>
        {category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        ) : (
          <View />
        )}
        {duration != null ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>🕐 {duration} min</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.bottom}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  if (imageUri) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.image}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >
          {content}
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, styles.solidBg]}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 180,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  solidBg: {
    backgroundColor: '#E8470A',
  },
  image: {
    width: '100%',
    minHeight: 180,
  },
  imageStyle: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    minHeight: 180,
    backgroundColor: 'rgba(232, 71, 10, 0.65)',
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bottom: {
    marginTop: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
