import { Button, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/core';

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const handleContinueOffline = () => {};
    return (
        <View style={Styles.container}>
            <Text>ONboarding screen</Text>

            <Button title={'Continue Offline'} onPress={handleContinueOffline} />
        </View>
    );
};

const Styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default OnboardingScreen;
