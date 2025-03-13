const kandydatModel = require('../models/kandydatModel');

/**
 * Kontroler obsługujący operacje związane z kandydatami
 */
class KandydatController {
  /**
   * Pobiera dane kandydata na podstawie ID użytkownika
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async getKandydatData(req, res) {
    try {
      const userId = req.params.userId;
      
      // Sprawdź, czy ID jest prawidłowe
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowe ID użytkownika'
        });
      }
      
      // Sprawdź, czy ID z żądania odpowiada ID zalogowanego użytkownika lub czy użytkownik ma uprawnienia administratora/duszpasterza
      const isAdmin = req.user.roles.includes('administrator');
      const isDuszpasterz = req.user.roles.includes('duszpasterz');
      const isKancelaria = req.user.roles.includes('kancelaria');
      const isAnimator = req.user.roles.includes('animator');
      const isRodzic = req.user.roles.includes('rodzic');
      
      // Kandydat może widzieć tylko swoje dane, administrator/duszpasterz/kancelaria mogą widzieć dane wszystkich
      // Animator może widzieć dane kandydatów ze swojej grupy
      // Rodzic może widzieć dane swoich dzieci
      if (parseInt(userId) !== req.user.id && !isAdmin && !isDuszpasterz && !isKancelaria) {
        // Tutaj trzeba by sprawdzić, czy użytkownik jest animatorem grupy, do której należy kandydat
        // lub czy jest rodzicem kandydata, ale to wymaga dodatkowych zapytań do bazy
        // Na potrzeby tej implementacji pominiemy te sprawdzenia
        return res.status(403).json({
          success: false,
          message: 'Brak uprawnień do wyświetlania danych tego kandydata'
        });
      }
      
      // Pobierz dane kandydata
      const kandydatData = await kandydatModel.getKandydatData(userId);
      
      if (!kandydatData) {
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono danych kandydata'
        });
      }
      
      // Zwróć dane kandydata
      return res.status(200).json({
        success: true,
        data: kandydatData
      });
    } catch (error) {
      console.error('Błąd podczas pobierania danych kandydata:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas pobierania danych kandydata',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Pobiera listę wszystkich szkół
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async getSzkoly(req, res) {
    try {
      const szkoly = await kandydatModel.getAllSzkoly();
      
      return res.status(200).json({
        success: true,
        data: szkoly
      });
    } catch (error) {
      console.error('Błąd podczas pobierania listy szkół:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas pobierania listy szkół',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Pobiera listę wszystkich parafii
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async getParafie(req, res) {
    try {
      const parafie = await kandydatModel.getAllParafie();
      
      return res.status(200).json({
        success: true,
        data: parafie
      });
    } catch (error) {
      console.error('Błąd podczas pobierania listy parafii:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas pobierania listy parafii',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Pobiera listę wszystkich grup
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async getGrupy(req, res) {
    try {
      const grupy = await kandydatModel.getAllGrupy();
      
      return res.status(200).json({
        success: true,
        data: grupy
      });
    } catch (error) {
      console.error('Błąd podczas pobierania listy grup:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas pobierania listy grup',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Dodaje lub aktualizuje rodzica kandydata
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async saveRodzic(req, res) {
    try {
      const { userId } = req.params;
      const rodzicData = req.body;
      
      // Sprawdź, czy ID jest prawidłowe
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowe ID użytkownika'
        });
      }
      
      // Sprawdź, czy ID z żądania odpowiada ID zalogowanego użytkownika lub czy użytkownik ma uprawnienia administratora/duszpasterza
      const isAdmin = req.user.roles.includes('administrator');
      const isDuszpasterz = req.user.roles.includes('duszpasterz');
      const isKancelaria = req.user.roles.includes('kancelaria');
      
      if (parseInt(userId) !== req.user.id && !isAdmin && !isDuszpasterz && !isKancelaria) {
        return res.status(403).json({
          success: false,
          message: 'Brak uprawnień do edycji danych tego kandydata'
        });
      }
      
      // Walidacja danych rodzica
      if (!rodzicData.imie || !rodzicData.nazwisko) {
        return res.status(400).json({
          success: false,
          message: 'Imię i nazwisko rodzica są wymagane'
        });
      }
      
      // Dodaj lub zaktualizuj rodzica
      const result = await kandydatModel.saveRodzic(userId, rodzicData);
      
      return res.status(200).json({
        success: true,
        message: 'Dane rodzica zostały zapisane',
        data: result
      });
    } catch (error) {
      console.error('Błąd podczas zapisywania danych rodzica:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas zapisywania danych rodzica',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Przypisuje kandydata do grupy
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async assignToGrupa(req, res) {
    try {
      const { userId } = req.params;
      const { grupaId } = req.body;
      
      // Sprawdź, czy ID jest prawidłowe
      if (!userId || isNaN(userId) || !grupaId || isNaN(grupaId)) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowe ID użytkownika lub grupy'
        });
      }
      
      // Sprawdź, czy użytkownik ma uprawnienia administratora/duszpasterza/animatora
      const isAdmin = req.user.roles.includes('administrator');
      const isDuszpasterz = req.user.roles.includes('duszpasterz');
      const isKancelaria = req.user.roles.includes('kancelaria');
      const isAnimator = req.user.roles.includes('animator');
      
      if (!isAdmin && !isDuszpasterz && !isKancelaria && !isAnimator) {
        return res.status(403).json({
          success: false,
          message: 'Brak uprawnień do przypisania kandydata do grupy'
        });
      }
      
      // Przypisz kandydata do grupy
      await kandydatModel.assignToGrupa(userId, grupaId);
      
      return res.status(200).json({
        success: true,
        message: 'Kandydat został przypisany do grupy'
      });
    } catch (error) {
      console.error('Błąd podczas przypisywania kandydata do grupy:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas przypisywania kandydata do grupy',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Dodaje lub aktualizuje świadka kandydata
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async saveSwiadek(req, res) {
    try {
      const { userId } = req.params;
      const swiadekData = req.body;
      
      // Sprawdź, czy ID jest prawidłowe
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowe ID użytkownika'
        });
      }
      
      // Sprawdź, czy ID z żądania odpowiada ID zalogowanego użytkownika lub czy użytkownik ma uprawnienia
      const isAdmin = req.user.roles.includes('administrator');
      const isDuszpasterz = req.user.roles.includes('duszpasterz');
      const isKancelaria = req.user.roles.includes('kancelaria');
      const isAnimator = req.user.roles.includes('animator');
      const isRodzic = req.user.roles.includes('rodzic');
      
      // Kandydat może dodać świadka tylko dla siebie, administrator/duszpasterz/kancelaria/animator mogą dla wszystkich
      // Rodzic może dodać świadka dla swoich dzieci
      if (parseInt(userId) !== req.user.id && !isAdmin && !isDuszpasterz && !isKancelaria && !isAnimator && !isRodzic) {
        return res.status(403).json({
          success: false,
          message: 'Brak uprawnień do dodania świadka dla tego kandydata'
        });
      }
      
      // Walidacja danych świadka
      if (!swiadekData.imie || !swiadekData.nazwisko) {
        return res.status(400).json({
          success: false,
          message: 'Imię i nazwisko świadka są wymagane'
        });
      }
      
      // Dodaj lub zaktualizuj świadka
      const result = await kandydatModel.saveSwiadek(userId, swiadekData);
      
      return res.status(200).json({
        success: true,
        message: 'Dane świadka zostały zapisane',
        data: result
      });
    } catch (error) {
      console.error('Błąd podczas zapisywania danych świadka:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas zapisywania danych świadka',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Dodaje lub aktualizuje imię bierzmowania kandydata
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async saveImieBierzmowania(req, res) {
    try {
      const { userId } = req.params;
      const imieData = req.body;
      
      // Sprawdź, czy ID jest prawidłowe
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowe ID użytkownika'
        });
      }
      
      // Sprawdź, czy ID z żądania odpowiada ID zalogowanego użytkownika lub czy użytkownik ma uprawnienia
      const isAdmin = req.user.roles.includes('administrator');
      const isDuszpasterz = req.user.roles.includes('duszpasterz');
      const isKancelaria = req.user.roles.includes('kancelaria');
      
      // Tylko kandydat może dodać imię bierzmowania dla siebie, administrator/duszpasterz/kancelaria mogą dla wszystkich
      if (parseInt(userId) !== req.user.id && !isAdmin && !isDuszpasterz && !isKancelaria) {
        return res.status(403).json({
          success: false,
          message: 'Brak uprawnień do dodania imienia bierzmowania dla tego kandydata'
        });
      }
      
      // Walidacja danych imienia
      if (!imieData.imie || !imieData.uzasadnienie) {
        return res.status(400).json({
          success: false,
          message: 'Imię i uzasadnienie są wymagane'
        });
      }
      
      // Dodaj lub zaktualizuj imię bierzmowania
      const result = await kandydatModel.saveImieBierzmowania(userId, imieData);
      
      return res.status(200).json({
        success: true,
        message: 'Imię bierzmowania zostało zapisane',
        data: result
      });
    } catch (error) {
      console.error('Błąd podczas zapisywania imienia bierzmowania:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas zapisywania imienia bierzmowania',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Dodaje lub aktualizuje dane szkolne kandydata
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async saveSzkola(req, res) {
    try {
      const { userId } = req.params;
      const szkolaData = req.body;
      
      // Sprawdź, czy ID jest prawidłowe
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowe ID użytkownika'
        });
      }
      
      // Sprawdź, czy ID z żądania odpowiada ID zalogowanego użytkownika lub czy użytkownik ma uprawnienia
      const isAdmin = req.user.roles.includes('administrator');
      const isDuszpasterz = req.user.roles.includes('duszpasterz');
      const isKancelaria = req.user.roles.includes('kancelaria');
      
      if (parseInt(userId) !== req.user.id && !isAdmin && !isDuszpasterz && !isKancelaria) {
        return res.status(403).json({
          success: false,
          message: 'Brak uprawnień do edycji danych szkolnych tego kandydata'
        });
      }
      
      // Walidacja danych szkolnych
      if (!szkolaData.szkola_id || !szkolaData.klasa || !szkolaData.rok_szkolny) {
        return res.status(400).json({
          success: false,
          message: 'Szkoła, klasa i rok szkolny są wymagane'
        });
      }
      
      // Dodaj lub zaktualizuj dane szkolne
      const result = await kandydatModel.saveSzkola(userId, szkolaData);
      
      return res.status(200).json({
        success: true,
        message: 'Dane szkolne zostały zapisane',
        data: result
      });
    } catch (error) {
      console.error('Błąd podczas zapisywania danych szkolnych:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas zapisywania danych szkolnych',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Przypisuje kandydata do parafii
   * @param {Object} req - Obiekt żądania Express
   * @param {Object} res - Obiekt odpowiedzi Express
   */
  async assignToParafia(req, res) {
    try {
      const { userId } = req.params;
      const { parafiaId } = req.body;
      
      // Sprawdź, czy ID jest prawidłowe
      if (!userId || isNaN(userId) || !parafiaId || isNaN(parafiaId)) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowe ID użytkownika lub parafii'
        });
      }
      
      // Sprawdź, czy ID z żądania odpowiada ID zalogowanego użytkownika lub czy użytkownik ma uprawnienia
      const isAdmin = req.user.roles.includes('administrator');
      const isDuszpasterz = req.user.roles.includes('duszpasterz');
      const isKancelaria = req.user.roles.includes('kancelaria');
      
      if (parseInt(userId) !== req.user.id && !isAdmin && !isDuszpasterz && !isKancelaria) {
        return res.status(403).json({
          success: false,
          message: 'Brak uprawnień do przypisania kandydata do parafii'
        });
      }
      
      // Przypisz kandydata do parafii
      await kandydatModel.assignToParafia(userId, parafiaId);
      
      return res.status(200).json({
        success: true,
        message: 'Kandydat został przypisany do parafii'
      });
    } catch (error) {
      console.error('Błąd podczas przypisywania kandydata do parafii:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas przypisywania kandydata do parafii',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new KandydatController(); 