// Variables to track motion
let lastX = 0;
let lastY = 0;
let lastZ = 0;
let motionThreshold = 10; // Lowered threshold for easier detection
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

    // Check if motion exceeds threshold
    if (deltaX > motionThreshold || deltaY > motionThreshold || deltaZ > motionThreshold) {
        const now = Date.now();
        if (now - lastMotionTime > 500) { // Prevent rapid triggers
            motionCount++;
            lastMotionTime = now;
            updateStatus('motion-status', `Motion detected! Count: ${motionCount}`, '#4ecdc4');
            
            // Require 2 motion events to trigger redirect
            if (motionCount >= 2) {
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

// Request permission and start listening for motion
function requestMotionPermission() {
    if (permissionRequested) return;
    permissionRequested = true;
    
    updateStatus('permission-status', 'Requesting motion permission...', '#f9ca24');
    
    DeviceMotionEvent.requestPermission()
        .then(permissionState => {
            updateStatus('permission-status', `Permission state: ${permissionState}`, 
                       permissionState === 'granted' ? '#00b894' : '#ff6b6b');
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
                updateStatus('motion-status', 'Motion detection started! Shake your phone!', '#00b894');
            } else {
                updateStatus('motion-status', 'Motion permission denied, using fallback', '#ff6b6b');
                setupFallback();
            }
        })
        .catch(error => {
            updateStatus('permission-status', `Error: ${error.message}`, '#ff6b6b');
            console.error('Error requesting motion permission:', error);
            setupFallback();
        });
}

// Start motion detection when page loads
function startMotionDetection() {
    updateStatus('motion-status', 'Starting motion detection...', '#f9ca24');
    
    // Check if DeviceMotion is supported
    if (typeof DeviceMotionEvent !== 'undefined') {
        updateStatus('motion-status', 'DeviceMotion is supported', '#6c5ce7');
        
        // Request permission (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            updateStatus('permission-status', 'Tap anywhere to enable motion detection', '#f9ca24');
            
            // Set up click handler to request permission
            document.addEventListener('click', () => {
                if (!permissionRequested) {
                    updateStatus('permission-status', 'Click detected, requesting permission...', '#f9ca24');
                    requestMotionPermission();
                }
            });
            
            // Also set up touch handler
            document.addEventListener('touchstart', () => {
                if (!permissionRequested) {
                    updateStatus('permission-status', 'Touch detected, requesting permission...', '#f9ca24');
                    requestMotionPermission();
                }
            });
            
        } else {
            // For devices that don't require permission
            updateStatus('permission-status', 'No permission required', '#00b894');
            updateStatus('motion-status', 'Starting motion detection...', '#6c5ce7');
            window.addEventListener('devicemotion', handleMotion);
            updateStatus('motion-status', 'Motion detection started!', '#00b894');
        }
        
        // Also try device orientation as backup
        if (typeof DeviceOrientationEvent !== 'undefined') {
            window.addEventListener('deviceorientation', handleOrientation);
            updateStatus('motion-status', 'Orientation detection also started!', '#00b894');
        }
        
    } else {
        updateStatus('motion-status', 'DeviceMotion not supported, using fallback', '#ff6b6b');
        setupFallback();
    }
}

// Fallback for devices without motion support
function setupFallback() {
    updateStatus('motion-status', 'Setting up click/touch fallback', '#f9ca24');
    document.addEventListener('click', () => {
        if (!isRedirecting) {
            updateStatus('motion-status', 'Click detected! Redirecting...', '#45b7d1');
            isRedirecting = true;
            window.location.href = 'letter.html';
        }
    });
    
    // Also listen for touch events
    document.addEventListener('touchstart', () => {
        if (!isRedirecting) {
            updateStatus('motion-status', 'Touch detected! Redirecting...', '#45b7d1');
            isRedirecting = true;
            window.location.href = 'letter.html';
        }
    });
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
