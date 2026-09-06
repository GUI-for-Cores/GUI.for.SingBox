//go:build darwin

package bridge

/*
#cgo darwin CFLAGS: -x objective-c
#cgo darwin LDFLAGS: -framework Cocoa

#import <Cocoa/Cocoa.h>
#import <dispatch/dispatch.h>
#import <pthread.h>

static void setPolicy(NSApplicationActivationPolicy policy) {
	void (^block)(void) = ^{
		[NSApp setActivationPolicy:policy];
	};
	if (pthread_main_np()) {
		block();
	} else {
		dispatch_sync(dispatch_get_main_queue(), block);
	}
}

static void setActivationPolicyRegular(void) {
	setPolicy(NSApplicationActivationPolicyRegular);
}

static void setActivationPolicyAccessory(void) {
	setPolicy(NSApplicationActivationPolicyAccessory);
}
*/
import "C"

func SetActivationPolicyRegular() {
	C.setActivationPolicyRegular()
}

func SetActivationPolicyAccessory() {
	C.setActivationPolicyAccessory()
}
