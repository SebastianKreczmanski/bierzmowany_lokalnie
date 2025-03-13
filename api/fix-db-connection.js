/**
 * Diagnostyka i naprawa połączenia z bazą danych
 * Ten skrypt jest używany do diagnozowania i naprawiania problemów z połączeniem z bazą danych.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Funkcja sprawdzająca, czy zmienne środowiskowe są poprawnie załadowane
function checkEnvironmentVariables() {
  console.log('Sprawdzanie zmiennych środowiskowych...');
  
  const requiredVariables = [
    'DB_HOST', 
    'DB_USER', 
    'DB_PASSWORD', 
    'DB_NAME', 
    'DB_PORT',
    'JWT_SECRET'
  ];
  
  const missingVariables = [];
  
  requiredVariables.forEach(variable => {
    if (!process.env[variable]) {
      missingVariables.push(variable);
      console.log(`❌ Brak zmiennej: ${variable}`);
    } else {
      if (variable.includes('PASSWORD') || variable.includes('SECRET')) {
        console.log(`✅ Zmienna ${variable} jest ustawiona (wartość ukryta)`);
      } else {
        console.log(`✅ Zmienna ${variable} = ${process.env[variable]}`);
      }
    }
  });
  
  return {
    success: missingVariables.length === 0,
    missingVariables
  };
}

// Funkcja naprawiająca problemy z połączeniem
function fixConnectionIssues() {
  console.log('\nNaprawianie problemów z połączeniem...');
  
  // Sprawdź czy plik .env istnieje w katalogu API
  const apiEnvPath = path.join(__dirname, '.env');
  const envExists = fs.existsSync(apiEnvPath);
  
  if (!envExists) {
    console.log('❌ Brak pliku .env w katalogu API. Tworzenie kopii z pliku głównego...');
    
    // Spróbuj skopiować z katalogu głównego
    const rootEnvPath = path.join(__dirname, '..', '.env.local');
    const rootEnvExists = fs.existsSync(rootEnvPath);
    
    if (rootEnvExists) {
      try {
        fs.copyFileSync(rootEnvPath, apiEnvPath);
        console.log('✅ Skopiowano plik .env.local z katalogu głównego do katalogu API.');
        return true;
      } catch (error) {
        console.error('❌ Błąd podczas kopiowania pliku .env:', error.message);
        return false;
      }
    } else {
      console.error('❌ Nie znaleziono pliku .env.local w katalogu głównym.');
      return false;
    }
  } else {
    console.log('✅ Plik .env istnieje w katalogu API.');
    return true;
  }
}

// Główna funkcja
async function main() {
  console.log('🔍 Rozpoczynam diagnostykę połączenia z bazą danych...\n');
  
  // Sprawdź zmienne środowiskowe
  const envCheck = checkEnvironmentVariables();
  
  if (!envCheck.success) {
    console.log('\n❌ Brakuje niektórych zmiennych środowiskowych.');
    
    // Spróbuj naprawić problemy
    const fixed = fixConnectionIssues();
    
    if (fixed) {
      console.log('\n✅ Problemy zostały naprawione. Proszę uruchomić serwer ponownie.');
    } else {
      console.log('\n❌ Nie udało się naprawić problemów. Sprawdź ręcznie plik .env.');
    }
  } else {
    console.log('\n✅ Wszystkie wymagane zmienne środowiskowe są dostępne!');
    
    // Uruchom test połączenia z bazą danych
    try {
      console.log('\nTrwa testowanie połączenia z bazą danych...');
      const db = require('./db');
      
      // Sprawdź połączenie
      const testConnection = await db.query('SELECT 1 as test');
      console.log('✅ Połączenie z bazą danych działa poprawnie!');
      
      // Sprawdź, czy zwróciło oczekiwane dane
      if (testConnection && testConnection.length > 0 && testConnection[0].test === 1) {
        console.log('✅ Zapytanie testowe zwróciło poprawne dane.');
      } else {
        console.log('⚠️ Zapytanie testowe nie zwróciło oczekiwanych danych.');
      }
    } catch (error) {
      console.error('❌ Błąd podczas testowania połączenia z bazą danych:', error.message);
      console.error('Szczegóły błędu:', error);
    }
  }
  
  console.log('\n🔍 Diagnostyka zakończona.');
}

// Uruchom główną funkcję
main().catch(error => {
  console.error('Nieprzewidziany błąd podczas diagnostyki:', error);
}); 