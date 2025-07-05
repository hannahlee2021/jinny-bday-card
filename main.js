console.log('main.js loaded successfully!');

// Variables to track motion
let lastX = 0;
let lastY = 0;
let lastZ = 0;
let motionThreshold = 25; // Increased threshold for more vigorous shaking required
let isRedirecting = false;
let motionCount = 0;
let lastMotionTime = 0;
let permissionRequested = false;

// Function to update status display
function updateStatus(elementId, message, color = '#666') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.color = color;
    }
    console.log(`${elementId}: ${message}`);
}

// Function to handle device motion
function handleMotion(event) {
    if (isRedirecting) return; // Prevent multiple redirects
    
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) {
        updateStatus('motion-status', 'No acceleration data available', '#ff6b6b');
        return;
    }

    const currentX = acceleration.x || 0;
    const currentY = acceleration.y || 0;
    const currentZ = acceleration.z || 0;

    // Calculate the difference from last reading
    const deltaX = Math.abs(currentX - lastX);
    const deltaY = Math.abs(currentY - lastY);
    const deltaZ = Math.abs(currentZ - lastZ);

    // Log motion data for debugging
    console.log(`Motion: X=${deltaX.toFixed(2)}, Y=${deltaY.toFixed(2)}, Z=${deltaZ.toFixed(2)}`);
    
    // Update status with current motion values
    updateStatus('motion-status', `Motion: X=${deltaX.toFixed(1)}, Y=${deltaY.toFixed(1)}, Z=${deltaZ.toFixed(1)} (need >${motionThreshold})`, '#4ecdc4');

    // Check if motion exceeds threshold
    if (deltaX > motionThreshold || deltaY > motionThreshold || deltaZ > motionThreshold) {
        const now = Date.now();
        if (now - lastMotionTime > 300) { // Shorter delay to capture vigorous shaking
            motionCount++;
            lastMotionTime = now;
            updateStatus('motion-status', `Motion detected! Count: ${motionCount}/6`, '#f9ca24');
            
            // Require 4 motion events to trigger redirect (more vigorous shaking)
            if (motionCount >= 4) {
                updateStatus('motion-status', 'Motion threshold reached! Redirecting...', '#45b7d1');
                isRedirecting = true;
                
                // Add a small delay to make the motion feel more natural
                setTimeout(() => {
                    window.location.href = 'letter.html';
                }, 300);
            }
        }
    }

    // Update last values
    lastX = currentX;
    lastY = currentY;
    lastZ = currentZ;
}

// Alternative motion detection using device orientation
function handleOrientation(event) {
    if (isRedirecting) return;
    
    const beta = event.beta; // X-axis rotation
    const gamma = event.gamma; // Y-axis rotation
    
    if (Math.abs(beta) > 20 || Math.abs(gamma) > 20) {
        updateStatus('motion-status', 'Orientation change detected! Redirecting...', '#45b7d1');
        isRedirecting = true;
        setTimeout(() => {
            window.location.href = 'letter.html';
        }, 300);
    }
}

// Simple function to enable motion detection
function enableMotionDetection() {
    if (permissionRequested) {
        updateStatus('permission-status', 'Motion detection already requested', '#f9ca24');
        return;
    }
    
    permissionRequested = true;
    updateStatus('permission-status', 'Requesting motion permission...', '#f9ca24');
    console.log('Requesting motion permission...');
    
    // Check if we need to request permission
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                console.log('Motion permission result:', permissionState);
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    updateStatus('motion-status', 'Motion detection started! Shake your phone!', '#00b894');
                    updateStatus('permission-status', 'Motion permission granted', '#00b894');
                } else {
                    updateStatus('motion-status', 'Motion permission denied', '#ff6b6b');
                    updateStatus('permission-status', 'Permission denied', '#ff6b6b');
                }
            })
            .catch(error => {
                console.error('Motion permission error:', error);
                updateStatus('motion-status', 'Motion permission failed', '#ff6b6b');
                updateStatus('permission-status', 'Permission error', '#ff6b6b');
            });
    } else {
        // For devices that don't require permission
        window.addEventListener('devicemotion', handleMotion);
        updateStatus('motion-status', 'Motion detection started! Shake your phone!', '#00b894');
        updateStatus('permission-status', 'No permission required', '#00b894');
    }
}

// Start motion detection when page loads
function startMotionDetection() {
    updateStatus('motion-status', 'Ready to enable motion detection', '#f9ca24');
    updateStatus('permission-status', 'Tap "Enable Motion" to start', '#f9ca24');
    
    // Add test button functionality
    const testButton = document.getElementById('test-button');
    if (testButton) {
        testButton.addEventListener('click', () => {
            updateStatus('motion-status', 'Test button clicked! Redirecting...', '#45b7d1');
            setTimeout(() => {
                window.location.href = 'letter.html';
            }, 300);
        });
    }
    
    // Create an "Enable Motion" button
    const enableButton = document.createElement('button');
    enableButton.textContent = 'click me first!';
    enableButton.style.cssText = `
        position: fixed;
        top: 50%;
        left: 69%;
        
       width: 60px;
       height: 60px;
        font-size: 10px;
        background: #84FC14;
        color: black;
        border: 1px solid black;
        border-radius: 50%;
        cursor: pointer;
        z-index: 1000;
    `;
    
    enableButton.addEventListener('click', () => {
        enableMotionDetection();
        enableButton.style.display = 'none'; // Hide button after click
    });
    
    document.body.appendChild(enableButton);
    
    // Debug: Check what APIs are available
    console.log('DeviceMotionEvent available:', typeof DeviceMotionEvent !== 'undefined');
    console.log('DeviceMotionEvent.requestPermission available:', typeof DeviceMotionEvent?.requestPermission === 'function');
}

// Start motion detection when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMotionDetection);
} else {
    startMotionDetection();
}

// Also try to start on window load as backup
window.addEventListener('load', () => {
    updateStatus('motion-status', 'Window loaded, checking motion detection...', '#f9ca24');
    if (!isRedirecting) {
        startMotionDetection();
    }
});

// Simple motion test function
function testMotion() {
    console.log('Testing motion detection...');
    updateStatus('motion-status', 'Testing motion detection...', '#f9ca24');
    
    // Try to request permission first
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                console.log('Test permission result:', permissionState);
                if (permissionState === 'granted') {
                    // Add a simple motion listener
                    window.addEventListener('devicemotion', (event) => {
                        console.log('Motion event received!', event);
                        updateStatus('motion-status', 'Motion events are working!', '#00b894');
                    });
                    console.log('Motion listener added successfully with permission');
                    updateStatus('motion-status', 'Motion detection working!', '#00b894');
                } else {
                    console.log('Test permission denied');
                    updateStatus('motion-status', 'Motion permission denied', '#ff6b6b');
                }
            })
            .catch(error => {
                console.error('Test permission failed:', error);
                updateStatus('motion-status', 'Motion permission failed', '#ff6b6b');
            });
    } else {
        // For devices that don't require permission
        try {
            window.addEventListener('devicemotion', (event) => {
                console.log('Motion event received!', event);
                updateStatus('motion-status', 'Motion events are working!', '#00b894');
            });
            console.log('Motion listener added successfully');
            updateStatus('motion-status', 'Motion detection working!', '#00b894');
        } catch (error) {
            console.error('Failed to add motion listener:', error);
            updateStatus('motion-status', 'Motion listener failed', '#ff6b6b');
        }
    }
}
