import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  continueGroup: {
    marginVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  slider: {
    flex: 1,
    marginRight: 10,
  },
  timeText: {
    width: 40,
    textAlign: 'right',
  },
  continueControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  playButton: {
    padding: 10,
  },
  removeButton: {
    padding: 10,
  },
  generateButton: {
    marginTop: 20,
  },
  assistantButton: {
  marginTop: 10,
  marginBottom: 20,
},
inputOverlay: {
  width: '90%',
  borderRadius: 10,
  padding: 20,
},
inputContainer: {
  marginBottom: 20,
},
});