#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataManager, NSObject)

RCT_EXTERN_METHOD(updateTimerData:(NSString *)timerState
                 timeRemaining:(NSNumber *)timeRemaining
                 isBreak:(BOOL)isBreak
                 sessionCount:(NSNumber *)sessionCount
                 dailyMinutes:(NSNumber *)dailyMinutes)

RCT_EXTERN_METHOD(updateDailyStats:(NSString *)date
                 minutes:(NSNumber *)minutes
                 sessions:(NSNumber *)sessions)

@end