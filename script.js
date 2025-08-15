class ChartAI {
    constructor() {
        this.lastImageDataUrl = null; // To store the last uploaded image data URL
        this.supabase = window.supabase; // Access the globally defined Supabase client
        this.setupInitialUIListeners(); // For elements that persist or are available at load
        this.setupDynamicUIListeners(); // For elements that are recreated via innerHTML
        this.setupModalListeners(); // Setup listeners for new modal functionality
        this.setupAuthListeners(); // Setup Supabase authentication listeners
    }

    setupInitialUIListeners() {
        // Event listener for the "Try Free Demo" button
        document.getElementById('try-demo').addEventListener('click', () => {
            document.getElementById('demo-section').scrollIntoView({ 
                behavior: 'smooth' 
            });
        });

        // Event listener for the "Get Detailed Analysis" button
        const getFullAnalysisBtn = document.getElementById('get-full-analysis');
        if (getFullAnalysisBtn) {
            getFullAnalysisBtn.addEventListener('click', async (e) => {
                const btn = e.target;
                const originalText = btn.textContent;
                
                if (this.lastImageDataUrl) {
                    btn.innerHTML = '<span class="loading"></span> Generating Report...';
                    btn.disabled = true;

                    try {
                        const detailedReport = await this.getDetailedAnalysis(this.lastImageDataUrl);
                        // Display the actual AI-generated detailed report in the dedicated section
                        this.displayDetailedReport(detailedReport); 
                    } catch (error) {
                        console.error('Failed to generate detailed report:', error);
                        alert('Failed to generate detailed report. Please try again.');
                    } finally {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }
                } else {
                    alert('Please upload a chart first to get a detailed analysis.');
                    btn.textContent = originalText; // Revert immediately if no image
                    btn.disabled = false;
                }
            });
        }

        // Event listener for the "Close Report" button
        const closeReportBtn = document.getElementById('close-report-btn');
        if (closeReportBtn) {
            closeReportBtn.addEventListener('click', () => {
                document.getElementById('detailed-analysis-report').style.display = 'none';
                document.getElementById('report-content').innerHTML = ''; // Clear content
            });
        }
    }

    // This method sets up listeners for elements within the upload-area that might be replaced
    setupDynamicUIListeners() {
        const uploadArea = document.getElementById('upload-area');
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-input');
        const retryBtn = document.getElementById('retry-btn'); // For error state

        // Listener for the "Choose File" button
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        // Listener for when a file is selected via the hidden input
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }

        // Listener for clicking the general upload area (delegation)
        if (uploadArea) {
            uploadArea.addEventListener('click', (e) => {
                // Ensure click on the area itself, but not specifically on the buttons within it
                if (e.target.id === 'upload-area' || e.target.closest('.upload-content')) {
                    if (fileInput && e.target.id !== 'upload-btn' && e.target.id !== 'retry-btn') {
                        fileInput.click();
                    }
                }
            });
        }

        // Listener for the "Try Again" button in error state
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.resetUploadArea();
            });
        }
    }

    setupModalListeners() {
        const signinBtn = document.getElementById('signin-btn');
        const getstartedBtn = document.getElementById('getstarted-btn');
        const logoutBtn = document.getElementById('logout-btn'); // Get logout button
        const signinModal = document.getElementById('signin-modal');
        const signupModal = document.getElementById('signup-modal');
        const closeButtons = document.querySelectorAll('.close-button');
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const signinError = document.getElementById('signin-error');
        const signupError = document.getElementById('signup-error');

        signinBtn.addEventListener('click', () => this.openModal(signinModal));
        getstartedBtn.addEventListener('click', () => this.openModal(signupModal));
        logoutBtn.addEventListener('click', () => this.handleLogout());

        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                this.closeModal(document.getElementById(modalId));
                signinError.textContent = ''; // Clear errors on close
                signupError.textContent = ''; // Clear errors on close
            });
        });

        // Close modal if clicked outside modal-content
        window.addEventListener('click', (e) => {
            if (e.target === signinModal) {
                this.closeModal(signinModal);
                signinError.textContent = '';
            }
            if (e.target === signupModal) {
                this.closeModal(signupModal);
                signupError.textContent = '';
            }
        });

        // Handle sign-in form submission
        if (signinForm) {
            signinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                signinError.textContent = ''; // Clear previous errors
                const email = signinForm['signin-email'].value;
                const password = signinForm['signin-password'].value;

                const { error } = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    signinError.textContent = error.message;
                    console.error('Sign-in error:', error.message);
                } else {
                    alert('Signed in successfully!');
                    this.closeModal(signinModal);
                }
            });
        }

        // Handle sign-up form submission
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                signupError.textContent = ''; // Clear previous errors
                const email = signupForm['signup-email'].value;
                const password = signupForm['signup-password'].value;

                const { error } = await this.supabase.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) {
                    signupError.textContent = error.message;
                    console.error('Sign-up error:', error.message);
                } else {
                    alert('Signed up successfully! Please check your email to confirm your account.');
                    this.closeModal(signupModal);
                }
            });
        }
    }

    setupAuthListeners() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.updateAuthUI(session);
        });
        // Call immediately to set initial state
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            this.updateAuthUI(session);
        });
    }

    updateAuthUI(session) {
        const signinBtn = document.getElementById('signin-btn');
        const getstartedBtn = document.getElementById('getstarted-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (session) {
            signinBtn.style.display = 'none';
            getstartedBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
        } else {
            signinBtn.style.display = 'block';
            getstartedBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
    }

    async handleLogout() {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error.message);
            alert('Failed to log out. Please try again.');
        } else {
            alert('Logged out successfully!');
            // updateAuthUI will be called automatically by onAuthStateChange
        }
    }

    openModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'flex'; // Use flex to center content
        }
    }

    closeModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'none';
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
    }

    async handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size must be less than 10MB');
            return;
        }

        // Show loading state
        this.showLoadingState();

        try {
            // Convert file to base64 for AI analysis
            const imageDataUrl = await this.fileToDataUrl(file);
            this.lastImageDataUrl = imageDataUrl; // Store the image data URL
            
            // Analyze the chart image
            const analysis = await this.analyzeChart(imageDataUrl);
            
            // Display results
            this.displayResults(analysis);
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError('Analysis failed. Please try again.');
        }
    }

    showLoadingState() {
        const uploadArea = document.getElementById('upload-area');
        uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="loading"></div>
                <h3>Analyzing your chart...</h3>
                <p>Our AI is processing your image and analyzing patterns</p>
            </div>
            <input type="file" id="file-input" accept="image/*" hidden> 
        `;
        this.setupDynamicUIListeners(); // Re-setup listeners for newly created elements
    }

    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async analyzeChart(imageDataUrl) {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert trading analyst. Analyze the provided chart image and provide clear, actionable trading signals.
                    
                    Respond with JSON only, following this exact schema. Ensure all fields are populated accurately based on the chart.
                    {
                        "signal": "BUY" | "SELL" | "HOLD", // Strictly choose one of these three options. Prioritize BUY or SELL if there's a strong directional indication. Only use HOLD if no clear directional bias or significant market uncertainty is observed.
                        "strength": "WEAK" | "MODERATE" | "STRONG",
                        "confidence": number, // (1-100)
                        "reasoning": "detailed explanation of the analysis, including specific patterns and indicators found",
                        "patterns": ["array of detected patterns, e.g., 'Bullish Engulfing'", "Doji"], // List all relevant patterns. Can be empty if no patterns are detected.
                        "indicators": {
                            "rsi": "value and status (e.g., '28.4 (Oversold)')",
                            "macd": "status (e.g., 'Bullish Crossover')",
                            "support": "price level (e.g., '$42,850')",
                            "resistance": "price level (e.g., '$45,000')"
                        },
                        "timeframe": "detected timeframe from the chart (e.g., '1-hour' or 'Daily')", // Can be null if not visible
                        "symbol": "detected asset symbol from the chart (e.g., 'BTC/USD' or 'AAPL')", // Can be null if not visible
                        "risk_assessment": "short assessment of the overall risk (e.g., 'Low Risk', 'Moderate Risk', 'High Risk')"
                    }
                    
                    Analyze the chart thoroughly focusing on:
                    - Candlestick patterns and their implications (e.g., Doji, Hammer, Engulfing, Morning Star, Evening Star, Head and Shoulders, Double Top/Bottom, Triangles)
                    - Identification of clear support and resistance levels.
                    - Interpretation of visible technical indicators (e.g., RSI, MACD, Bollinger Bands, Moving Averages).
                    - Overall trend analysis (uptrend, downtrend, sideways).
                    - Potential future price movements and associated risks.
                    
                    Your primary goal is to provide an accurate and decisive trading signal (BUY/SELL/HOLD) based on compelling technical evidence.`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Please analyze this trading chart and provide a comprehensive trading signal."
                        },
                        {
                            type: "image_url",
                            image_url: { url: imageDataUrl }
                        }
                    ]
                }
            ],
            json: true
        });

        return JSON.parse(completion.content);
    }

    async getDetailedAnalysis(imageDataUrl) {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert trading analyst. Based on the provided chart image, generate a very detailed, comprehensive analysis report.
                    Focus on providing a narrative, elaborating on detected patterns, indicators, support/resistance, trends, and potential future movements.
                    The report should be extensive, well-structured, and provide deeper insights than a summary signal.
                    Respond with plain text, not JSON.`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Generate a comprehensive detailed analysis report for this trading chart."
                        },
                        {
                            type: "image_url",
                            image_url: { url: imageDataUrl }
                        }
                    ]
                }
            ],
        });
        return completion.content;
    }

    displayResults(analysis) {
        const resultsDiv = document.getElementById('analysis-results');
        const signalCard = document.getElementById('signal-card'); // Get the signal-card element
        const signalBadge = document.getElementById('signal-badge');
        const confidence = document.getElementById('confidence');
        const signalReason = document.getElementById('signal-reason');
        const detailsGrid = document.getElementById('details-grid');

        // Update signal badge
        const signalText = `${analysis.strength || ''} ${analysis.signal || 'N/A'}`.trim(); // Ensure text is not empty if strength/signal are missing
        signalBadge.textContent = signalText;
        
        // Ensure class name is one of 'buy', 'sell', 'hold'. Default to 'buy' if unknown.
        let signalClass = 'buy'; // Default to buy
        if (analysis.signal) {
            const lowerCaseSignal = analysis.signal.toLowerCase();
            if (lowerCaseSignal.includes('buy')) {
                signalClass = 'buy';
            } else if (lowerCaseSignal.includes('sell')) {
                signalClass = 'sell';
            } else if (lowerCaseSignal.includes('hold')) {
                signalClass = 'hold';
            }
        }
        signalBadge.className = `signal-badge ${signalClass}`;
        signalCard.className = `signal-card ${signalClass}`; // Apply class to signal-card as well for border color

        // Update confidence
        confidence.textContent = `${analysis.confidence || 'N/A'}% Confidence`;

        // Update reasoning
        signalReason.textContent = analysis.reasoning || 'No specific reasoning provided.';

        // Update technical details
        detailsGrid.innerHTML = '';
        
        // Add patterns
        if (analysis.patterns && analysis.patterns.length > 0) {
            this.addDetailItem(detailsGrid, 'Patterns Detected', analysis.patterns.join(', '));
        }

        // Add indicators
        if (analysis.indicators) {
            Object.entries(analysis.indicators).forEach(([key, value]) => {
                if (value) {
                    const label = key.replace(/_/g, ' ').toUpperCase(); // Replace underscores for display
                    this.addDetailItem(detailsGrid, label, value.toString());
                }
            });
        }

        // Add symbol and timeframe if detected
        if (analysis.symbol) {
            this.addDetailItem(detailsGrid, 'Symbol', analysis.symbol);
        }
        
        if (analysis.timeframe) {
            this.addDetailItem(detailsGrid, 'Timeframe', analysis.timeframe);
        }

        // Add risk assessment
        if (analysis.risk_assessment) {
            this.addDetailItem(detailsGrid, 'Risk Assessment', analysis.risk_assessment);
        }

        // Show results with animation
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });

        // Reset upload area for next upload
        this.resetUploadArea();
    }

    addDetailItem(container, label, value) {
        const item = document.createElement('div');
        item.className = 'detail-item';
        item.innerHTML = `
            <span class="detail-label">${label}</span>
            <span class="detail-value">${value}</span>
        `;
        container.appendChild(item);
    }

    displayDetailedReport(reportContent) {
        const reportDiv = document.getElementById('detailed-analysis-report');
        const contentDiv = document.getElementById('report-content');
        
        contentDiv.textContent = reportContent; // Use textContent to preserve formatting and prevent XSS
        reportDiv.style.display = 'block';
        reportDiv.scrollIntoView({ behavior: 'smooth' });
    }

    resetUploadArea() {
        const uploadArea = document.getElementById('upload-area');
        uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">📊</div>
                <h3>Upload another chart</h3>
                <p>Supports PNG, JPG, JPEG files up to 10MB</p>
                <button class="btn-upload" id="upload-btn">Choose File</button>
            </div>
            <input type="file" id="file-input" accept="image/*" hidden> 
        `;
        this.setupDynamicUIListeners(); // Re-setup listeners for newly created elements
    }

    showError(message) {
        const uploadArea = document.getElementById('upload-area');
        uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">❌</div>
                <h3>Analysis Failed</h3>
                <p>${message}</p>
                <button class="btn-upload" id="retry-btn">Try Again</button>
            </div>
            <input type="file" id="file-input" accept="image/*" hidden> 
        `;
        this.setupDynamicUIListeners(); // Re-setup listeners for newly created elements
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const chartAI = new ChartAI();
    chartAI.setupDragAndDrop(); // Call this once after the instance is created
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});