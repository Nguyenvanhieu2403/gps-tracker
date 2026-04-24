pipeline {
    agent any

    stages {

        stage('Build Docker') {
            steps {
                sh 'docker build -t gps-tracker .'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                docker rm -f gps-tracker || true
                docker run -d -p 4200:80 --name gps-tracker gps-tracker
                '''
            }
        }
    }
}