console.log('main.js loaded successfully!');

// Variables to track motion
let lastX = 0;
let lastY = 0;
let lastZ = 0;
let motionThreshold = 20; // Lowered threshold for easier detection
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
        if (now - lastMotionTime > 300) { // Reduced delay for faster response
            motionCount++;
            lastMotionTime = now;
            updateStatus('motion-status', `Motion detected! Count: ${motionCount}/2`, '#f9ca24');
            
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
    console.log('Starting permission request...');
    
    try {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                console.log('Permission result:', permissionState);
                updateStatus('permission-status', `Permission state: ${permissionState}`, 
                           permissionState === 'granted' ? '#00b894' : '#ff6b6b');
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    updateStatus('motion-status', 'Motion detection started! Shake your phone!', '#00b894');
                    console.log('Motion detection successfully started');
                } else {
                    updateStatus('motion-status', 'Motion permission denied, using fallback', '#ff6b6b');
                    console.log('Permission denied, setting up fallback');
                    setupFallback();
                }
            })
            .catch(error => {
                console.error('Permission request failed:', error);
                updateStatus('permission-status', `Error: ${error.message}`, '#ff6b6b');
                setupFallback();
            });
    } catch (error) {
        console.error('Error in permission request:', error);
        updateStatus('permission-status', `Error: ${error.message}`, '#ff6b6b');
        setupFallback();
    }
}

// Start motion detection when page loads
function startMotionDetection() {
    updateStatus('motion-status', 'Starting motion detection...', '#f9ca24');
    
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
    
    // Add test motion button functionality
    const testMotionButton = document.getElementById('test-motion-button');
    if (testMotionButton) {
        testMotionButton.addEventListener('click', () => {
            testMotion();
        });
    }
    
    // Debug: Check what APIs are available
    console.log('DeviceMotionEvent available:', typeof DeviceMotionEvent !== 'undefined');
    console.log('DeviceOrientationEvent available:', typeof DeviceOrientationEvent !== 'undefined');
    console.log('DeviceMotionEvent.requestPermission available:', typeof DeviceMotionEvent?.requestPermission === 'function');
    
    // Check if DeviceMotion is supported
    if (typeof DeviceMotionEvent !== 'undefined') {
        updateStatus('motion-status', 'DeviceMotion is supported', '#6c5ce7');
        
        // Try direct motion detection first (works on some devices)
        let motionStarted = false;
        
        function tryStartMotion() {
            if (motionStarted) return;
            motionStarted = true;
            permissionRequested = true;
            
            updateStatus('permission-status', 'Starting motion detection...', '#f9ca24');
            console.log('Starting motion detection after user interaction...');
            
            // For iOS Safari, we need to request permission in a very specific way
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                // Request permission immediately after user interaction
                DeviceMotionEvent.requestPermission()
                    .then(permissionState => {
                        console.log('Permission result:', permissionState);
                        if (permissionState === 'granted') {
                            // Now add the motion listener
                            window.addEventListener('devicemotion', handleMotion);
                            updateStatus('motion-status', 'Motion detection started! Shake your phone!', '#00b894');
                            updateStatus('permission-status', 'Motion detection active', '#00b894');
                            console.log('Motion detection started with permission');
                        } else {
                            updateStatus('motion-status', 'Permission denied, using fallback', '#ff6b6b');
                            setupFallback();
                        }
                    })
                    .catch(error => {
                        console.error('Permission request failed:', error);
                        updateStatus('motion-status', 'Permission failed, using fallback', '#ff6b6b');
                        setupFallback();
                    });
            } else {
                // For devices that don't require permission
                try {
                    window.addEventListener('devicemotion', handleMotion);
                    updateStatus('motion-status', 'Motion detection started! Shake your phone!', '#00b894');
                    updateStatus('permission-status', 'Motion detection active', '#00b894');
                    console.log('Motion detection started directly');
                } catch (error) {
                    console.error('Direct motion detection failed:', error);
                    updateStatus('motion-status', 'Motion detection failed, using fallback', '#ff6b6b');
                    setupFallback();
                }
            }
        }
        
        // Request permission (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            updateStatus('permission-status', 'Tap anywhere to enable motion detection', '#f9ca24');
            
            // Set up click handler to start motion detection
            document.addEventListener('click', (event) => {
                // Don't trigger on test button click
                if (event.target.id === 'test-button') return;
                
                if (!permissionRequested) {
                    updateStatus('permission-status', 'Click detected, starting motion detection...', '#f9ca24');
                    console.log('Attempting to start motion detection...');
                    tryStartMotion();
                }
            });
            
            // Also set up touch handler
            document.addEventListener('touchstart', (event) => {
                // Don't trigger on test button touch
                if (event.target.id === 'test-button') return;
                
                if (!permissionRequested) {
                    updateStatus('permission-status', 'Touch detected, starting motion detection...', '#f9ca24');
                    console.log('Attempting to start motion detection via touch...');
                    tryStartMotion();
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
        console.log('DeviceMotionEvent is undefined - falling back to click/touch');
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
