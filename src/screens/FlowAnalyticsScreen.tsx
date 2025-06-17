import {View,Text,StyleSheet} from 'react-native';
import { FlowMetrics } from '../components/FlowMetrics';
import {usePomodoroStore} from '../store/pomodoroStore';
const FlowAnalyticsScreen = ()=>{
      const { flowMetrics } = usePomodoroStore();
    const getFlowAdvice = () => {
            const { flowIntensity, distractionCount, consecutiveSessions } = flowMetrics;
            
            if (flowIntensity === 'high') {
                return {
                    title: "🔥 You're in the Zone!",
                    advice: "You're experiencing deep flow. Consider extending your sessions slightly to maximize this state.",
                    tips: [
                        "Keep your current environment setup",
                        "Avoid interruptions during high flow periods",
                        "Consider batch similar tasks together"
                    ]
                };
            } else if (flowIntensity === 'medium') {
                return {
                    title: "⚡ Building Momentum",
                    advice: "You're developing good focus habits. A few tweaks can help you reach deeper flow states.",
                    tips: [
                        "Minimize distractions before starting",
                        "Try slightly longer sessions",
                        "Use background music or white noise"
                    ]
                };
            } else {
                return {
                    title: "🌱 Growing Your Focus",
                    advice: "Everyone starts somewhere. Small, consistent sessions will build your focus muscle.",
                    tips: [
                        "Start with shorter 15-minute sessions",
                        "Remove phone from workspace",
                        "Use the Pomodoro technique consistently"
                    ]
                };
            }
        };
    
      const advice = getFlowAdvice();
    return (
         <View>
                
                <FlowMetrics showDetailed={true} />
                
                <View style={styles.adviceSection}>
                    <Text style={styles.adviceTitle}>{advice.title}</Text>
                    <Text style={styles.adviceText}>{advice.advice}</Text>
                    
                    <Text style={styles.tipsTitle}>💡 Tips to improve:</Text>
                    {advice.tips.map((tip, index) => (
                        <Text key={index} style={styles.tipText}>• {tip}</Text>
                    ))}
                </View>
        </View>
    )
}

export default FlowAnalyticsScreen;

const styles = StyleSheet.create({
    // FLOW
   title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginVertical: 20,
    },
    adviceSection: {
        margin: 20,
        padding: 20,
        backgroundColor: '#F9FAFB',
   borderRadius: 16,
   borderLeftWidth: 4,
   borderLeftColor: '#10B981',
    },
    adviceTitle: {
   fontSize: 18,
   fontWeight: '600',
   marginBottom: 10,
   color: '#1F2937',
},
adviceText: {
   fontSize: 14,
   lineHeight: 20,
   color: '#6B7280',
   marginBottom: 16,
},
tipsTitle: {
   fontSize: 16,
   fontWeight: '600',
   marginBottom: 8,
   color: '#1F2937',
},
tipText: {
   fontSize: 14,
   lineHeight: 20,
   color: '#6B7280',
   marginBottom: 4,
   paddingLeft: 8,
},
})