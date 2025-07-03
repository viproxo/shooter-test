import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import useGameStore from '../../state/gameStore';

const SkillChoiceModal = () => {
  const { availableSkillsForLevelUp, selectSkill } = useGameStore(state => ({
    availableSkillsForLevelUp: state.availableSkillsForLevelUp,
    selectSkill: state.selectSkill,
  }));

  if (!availableSkillsForLevelUp || availableSkillsForLevelUp.length === 0) {
    return null; // Don't render if no skills to choose or not paused for skill selection
  }

  const handleSkillSelection = (skill) => {
    selectSkill(skill);
  };

  const renderSkillChoice = ({ item }) => (
    <TouchableOpacity style={styles.skillButton} onPress={() => handleSkillSelection(item)}>
      <Text style={styles.skillName}>{item.name}</Text>
      <Text style={styles.skillDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent={true}
      visible={true} // Visibility controlled by GameScreen's conditional rendering
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Level Up! Choose a Skill:</Text>
          <FlatList
            data={availableSkillsForLevelUp}
            renderItem={renderSkillChoice}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333', // Dark theme for modal
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  skillButton: {
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10, // Separated by ItemSeparatorComponent
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  skillDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  separator: {
    height: 10,
  }
});

export default SkillChoiceModal;
