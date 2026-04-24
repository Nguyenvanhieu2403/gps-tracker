pipeline {
    agent any

    environment {
        APP_NAME = "ultima"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                url: 'YOUR_GIT_URL'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t ultima .'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                docker rm -f ultima || true
                docker run -d -p 4200:80 --name ultima ultima
                '''
            }
        }
    }
}