import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<TasksStackParamList, 'AddEditTask'>;

export default function AddEditTaskScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>AddEditTaskScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
