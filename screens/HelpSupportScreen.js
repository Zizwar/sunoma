import React, { useContext } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../utils/ThemeContext';

const HelpSupportScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);

  const faqs = [
    { question: t('faq1Question'), answer: t('faq1Answer') },
    { question: t('faq2Question'), answer: t('faq2Answer') },
    { question: t('faq3Question'), answer: t('faq3Answer') },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text h4 style={[styles.header, { color: theme.colors.text }]}>{t('helpAndSupport')}</Text>
      
      <Text h5 style={[styles.subHeader, { color: theme.colors.text }]}>{t('frequentlyAskedQuestions')}</Text>
      {faqs.map((faq, index) => (
        <Card key={index} containerStyle={[styles.card, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF' }]}>
          <Card.Title style={{ color: theme.colors.text }}>{faq.question}</Card.Title>
          <Text style={{ color: theme.colors.text }}>{faq.answer}</Text>
        </Card>
      ))}
      
      <Text h5 style={[styles.subHeader, { color: theme.colors.text }]}>{t('needMoreHelp')}</Text>
      <Button
        title={t('contactSupport')}
        onPress={() => {/* Implement contact support logic */}}
        buttonStyle={styles.contactButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  subHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
  },
  contactButton: {
    marginTop: 20,
  },
});

export default HelpSupportScreen;