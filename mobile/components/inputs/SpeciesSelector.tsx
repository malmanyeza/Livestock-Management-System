import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { Text } from '@/components/typography/Text';
import Colors from '@/constants/Colors';

interface Species {
  id: string;
  name: string;
  imageUrl: string;
}

interface SpeciesSelectorProps {
  species: Species[];
  selectedSpecies: string | null;
  onSelectSpecies: (id: string) => void;
}

export function SpeciesSelector({
  species,
  selectedSpecies,
  onSelectSpecies,
}: SpeciesSelectorProps) {
  return (
    <View style={styles.container}>
      <Text variant="h6" weight="medium" style={styles.title}>
        Select Species
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {species.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.speciesCard,
              selectedSpecies === item.id && styles.selectedSpeciesCard,
            ]}
            onPress={() => onSelectSpecies(item.id)}
            activeOpacity={0.7}
          >
            <ImageBackground
              source={{ uri: item.imageUrl }}
              style={styles.speciesImage}
              imageStyle={styles.imageStyle}
            >
              <View
                style={[
                  styles.overlay,
                  selectedSpecies === item.id && styles.selectedOverlay,
                ]}
              />
              <Text
                variant="body"
                weight="bold"
                color="white"
                style={styles.speciesName}
              >
                {item.name}
              </Text>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  speciesCard: {
    width: 140,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSpeciesCard: {
    borderColor: Colors.primary[500],
  },
  speciesImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
  },
  selectedOverlay: {
    backgroundColor: 'rgba(122, 193, 66, 0.4)',
  },
  speciesName: {
    padding: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});