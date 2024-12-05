pipeline {
    agent any
    
    environment {
        PM2_PROCESS_NAME = 'krishibharat-backend'
        PM2_USER = 'darcox'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Deploy with PM2') {
            steps {
                script {
                    // Check if PM2 process exists
                    def processExists = sh(
                        script: "sudo -u ${PM2_USER} pm2 list | grep ${PM2_PROCESS_NAME} || true",
                        returnStatus: true
                    ) == 0
                    
                    if (!processExists) {
                        // Create new PM2 process if it doesn't exist
                        sh """
                            sudo -u ${PM2_USER} pm2 start npm --name ${PM2_PROCESS_NAME} -- start
                            echo "Created new PM2 process: ${PM2_PROCESS_NAME}"
                        """
                    } else {
                        // Reload existing PM2 process
                        sh """
                            sudo -u ${PM2_USER} pm2 reload ${PM2_PROCESS_NAME}
                            echo "Reloaded existing PM2 process: ${PM2_PROCESS_NAME}"
                        """
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    // Verify PM2 process status
                    sh "sudo -u ${PM2_USER} pm2 status ${PM2_PROCESS_NAME}"
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed. Please check the logs.'
        }
    }
}
