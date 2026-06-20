import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, Mail, Github, LifeBuoy } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import Colors from '@/constants/Colors';

interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqRow({ question, answer }: FaqItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={styles.faqCard}>
      <TouchableOpacity
        onPress={() => setExpanded(prev => !prev)}
        activeOpacity={0.7}
        style={styles.faqHeader}
      >
        <Text variant="body" weight="medium" style={styles.faqQuestion}>
          {question}
        </Text>
        {expanded ? (
          <ChevronUp size={20} color={Colors.primary[600]} />
        ) : (
          <ChevronDown size={20} color={Colors.neutral[500]} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.faqAnswerContainer}>
          <Text variant="body2" color="neutral.600" style={styles.faqAnswer}>
            {answer}
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function HelpScreen() {
  const router = useRouter();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@zvipfuwo.co.zw').catch((err) =>
      console.error('Failed to open mail app:', err)
    );
  };

  const handleOpenGithub = () => {
    Linking.openURL('https://github.com/malmanyeza/Livestock-Management-System').catch((err) =>
      console.error('Failed to open web browser:', err)
    );
  };

  const faqs = [
    {
      question: 'How do I create a Zvipfuwo account?',
      answer: 'Download the app and navigate to the Sign Up screen. Provide your name, email, and choose a strong password. You will immediately be set up with a secure farmer profile.',
    },
    {
      question: 'Is my livestock data secure?',
      answer: 'Yes, absolutely. Zvipfuwo uses PostgreSQL Row-Level Security (RLS) to isolate your farm database records. Your animals, treatments, and transaction histories can only be accessed by you.',
    },
    {
      question: 'Does the app require internet to run?',
      answer: 'Yes, Zvipfuwo requires an internet connection to securely synchronize your data with the cloud database. If connection is lost, the app will advise you of the offline status.',
    },
    {
      question: 'How can I delete my data?',
      answer: 'You can initiate account deletion directly inside the app. Go to the Profile screen and tap the "Delete Account" button. Confirming will permanently erase your profile and all associated livestock records from our databases.',
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Help & Support',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronLeft size={22} color={Colors.neutral[800]} />
              <Text variant="body" weight="medium" color={Colors.neutral[800]} style={{ marginLeft: 2 }}>
                Back
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScreenContainer style={styles.container} scrollable={true}>
        <View style={styles.content}>
          {/* Support Hero banner */}
          <Card style={styles.heroCard}>
            <View style={styles.heroIconContainer}>
              <LifeBuoy size={32} color={Colors.primary[600]} />
            </View>
            <Text variant="h4" weight="bold" style={styles.heroTitle}>
              Need Assistance?
            </Text>
            <Text variant="body" color="neutral.500" align="center" style={styles.heroDescription}>
              Find quick answers below or contact our team directly for custom help and bug reports.
            </Text>
          </Card>

          {/* FAQ Sections */}
          <Text variant="h5" weight="bold" style={styles.sectionTitle}>
            Frequently Asked Questions
          </Text>
          
          <View style={styles.faqList}>
            {faqs.map((faq, idx) => (
              <FaqRow key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </View>

          {/* Contact options */}
          <Text variant="h5" weight="bold" style={styles.sectionTitle}>
            Get in Touch
          </Text>

          <Card style={styles.contactCard}>
            <Text variant="body2" color="neutral.600" style={styles.contactIntro}>
              Our support team is happy to assist you with data management, queries, or feature requests.
            </Text>

            <TouchableOpacity
              onPress={handleEmailSupport}
              activeOpacity={0.7}
              style={styles.contactOption}
            >
              <View style={styles.contactIconWrapper}>
                <Mail size={20} color={Colors.primary[600]} />
              </View>
              <View style={styles.contactOptionText}>
                <Text variant="body" weight="medium">
                  Email Support
                </Text>
                <Text variant="caption" color="neutral.400">
                  support@zvipfuwo.co.zw
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenGithub}
              activeOpacity={0.7}
              style={styles.contactOption}
            >
              <View style={styles.contactIconWrapper}>
                <Github size={20} color={Colors.neutral[700]} />
              </View>
              <View style={styles.contactOptionText}>
                <Text variant="body" weight="medium">
                  GitHub Repository
                </Text>
                <Text variant="caption" color="neutral.400">
                  Submit bugs or inspect codebase
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    marginBottom: 8,
  },
  heroDescription: {
    lineHeight: 22,
  },
  sectionTitle: {
    marginBottom: 16,
    color: Colors.neutral[900],
  },
  faqList: {
    marginBottom: 24,
    gap: 12,
  },
  faqCard: {
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    paddingRight: 16,
    color: Colors.neutral[900],
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  faqAnswer: {
    lineHeight: 20,
  },
  contactCard: {
    padding: 20,
  },
  contactIntro: {
    marginBottom: 20,
    lineHeight: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  contactIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactOptionText: {
    flex: 1,
    gap: 2,
  },
});
