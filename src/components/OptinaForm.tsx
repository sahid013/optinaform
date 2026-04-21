'use client';

import { useState, useEffect } from 'react';
import styles from './OptinaForm.module.css';

type FormType = 'auto' | 'generic';

// Webhook URL
const WEBHOOK_URL = 'https://nassimaali.app.n8n.cloud/webhook/024b4d77-576e-4656-9ab4-00b00ab0bd11';

export default function OptinaForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formType, setFormType] = useState<FormType>('auto');
  const [activeTab, setActiveTab] = useState<'assurance' | 'energie'>('assurance');
  const [sliderValue, setSliderValue] = useState(300);
  const [selectedRadio, setSelectedRadio] = useState<string>('Particulier');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isModalOnlyMode, setIsModalOnlyMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hero form fields (Assurance)
  const [heroInsuranceType, setHeroInsuranceType] = useState('Auto');
  const [heroProfile, setHeroProfile] = useState('Particulier');

  // Hero form fields (Énergie)
  const [heroEnergyType, setHeroEnergyType] = useState('Électricité');

  // Multi-step form fields (Auto/Insurance)
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [bonusMalus, setBonusMalus] = useState(100);
  const [licenseDate, setLicenseDate] = useState('');
  const [currentInsurer, setCurrentInsurer] = useState('');
  const [currentMonthlyCost, setCurrentMonthlyCost] = useState('');

  // Multi-step form fields (Contact info - shared)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);

  const totalSteps = formType === 'auto' ? 3 : 2;
  const progressWidth = ((currentStep + 1) / totalSteps) * 100;

  // Check if embedded in iframe and if modal should be shown from URL
  useEffect(() => {
    setIsEmbedded(window.self !== window.top);

    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const modalParam = params.get('modal');

    if (modalParam && (modalParam === 'auto' || modalParam === 'generic')) {
      // URL has modal parameter, open modal automatically and hide initial card
      setFormType(modalParam as FormType);
      setIsModalOpen(true);
      setIsModalOnlyMode(true);
    }
  }, []);

  // Listen for messages from parent (for closing modal)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'OPTINA_CLOSE_MODAL') {
        setIsModalOpen(false);
        setCurrentStep(0);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen && !isEmbedded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, isEmbedded]);

  const openModal = (type: FormType) => {
    setFormType(type);
    setCurrentStep(0);

    // If embedded in iframe, send message to parent and don't show modal locally
    if (isEmbedded) {
      window.parent.postMessage({
        type: 'OPTINA_OPEN_MODAL',
        formType: type,
        currentStep: 0
      }, '*');
    } else {
      // Not embedded, show modal normally
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    if (isEmbedded) {
      window.parent.postMessage({
        type: 'OPTINA_CLOSE_MODAL'
      }, '*');
    } else {
      setIsModalOpen(false);
      setCurrentStep(0);
      setShowSuccess(false);
    }
  };

  // Webhook submission function
  const submitToWebhook = async (data: any) => {
    try {
      console.log('Submitting to webhook:', data);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is OK (status 200-299)
      if (response.ok) {
        // Try to parse response, but don't fail if it's not JSON
        try {
          const result = await response.json();
          console.log('Success response:', result);
        } catch (e) {
          const text = await response.text();
          console.log('Success response (non-JSON):', text);
        }
        return true;
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to submit form: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        alert(`Erreur: ${error}`);
      }

      return false;
    }
  };

  const handleNextStep = async () => {
    if (currentStep < totalSteps - 1) {
      // Validate current step before proceeding
      if (formType === 'auto' && currentStep === 0) {
        if (!vehicleBrand || !vehicleYear) {
          alert('Veuillez remplir tous les champs obligatoires.');
          return;
        }
      }

      const newStep = currentStep + 1;
      setCurrentStep(newStep);

      // If embedded, notify parent of step change
      if (isEmbedded) {
        window.parent.postMessage({
          type: 'OPTINA_STEP_CHANGE',
          step: newStep,
          formType: formType
        }, '*');
      }
    } else {
      // Validate final step
      if (!firstName || !lastName || !email || !phone) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
      }

      if (!gdprConsent) {
        alert('Veuillez accepter la politique de confidentialité pour continuer.');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Veuillez entrer une adresse email valide.');
        return;
      }

      // Final step - submit to webhook
      setIsSubmitting(true);

      const formData: any = {
        firstName,
        lastName,
        email,
        phone,
        formType,
        submittedAt: new Date().toISOString(),
      };

      // Add form-specific data
      if (formType === 'auto') {
        formData.insuranceType = heroInsuranceType;
        formData.profile = heroProfile;
        formData.vehicleBrand = vehicleBrand;
        formData.vehicleYear = vehicleYear;
        formData.bonusMalus = bonusMalus / 100; // Convert to decimal
        formData.licenseDate = licenseDate;
        formData.currentInsurer = currentInsurer;
        formData.currentMonthlyCost = currentMonthlyCost;
      } else if (formType === 'generic') {
        formData.energyType = heroEnergyType;
        formData.monthlyBill = sliderValue;
        formData.profile = selectedRadio;
      }

      const success = await submitToWebhook(formData);
      setIsSubmitting(false);

      if (success) {
        // Show success screen
        setShowSuccess(true);
        // Reset form fields
        resetForm();
      } else {
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setVehicleBrand('');
    setVehicleYear('');
    setBonusMalus(100);
    setLicenseDate('');
    setCurrentInsurer('');
    setCurrentMonthlyCost('');
    setGdprConsent(false);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);

      // If embedded, notify parent of step change
      if (isEmbedded) {
        window.parent.postMessage({
          type: 'OPTINA_STEP_CHANGE',
          step: newStep,
          formType: formType
        }, '*');
      }
    }
  };

  const handleTabClick = (tab: 'assurance' | 'energie') => {
    setActiveTab(tab);
  };

  const handleRadioSelect = (value: string) => {
    setSelectedRadio(value);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <div className={styles.formContainer}>
      {!isModalOnlyMode && (
      <div className={styles.heroCard}>
        <div className={styles.cardTabs}>
          <button
            className={`${styles.cardTab} ${activeTab === 'assurance' ? styles.active : ''}`}
            onClick={() => handleTabClick('assurance')}
          >
            Assurance
          </button>
          <button
            className={`${styles.cardTab} ${activeTab === 'energie' ? styles.active : ''}`}
            onClick={() => handleTabClick('energie')}
          >
            Énergie
          </button>
        </div>

        {/* Quick Form in Card Body */}
        <div className={styles.cardBody}>
          <div className={`${styles.tabContent} ${activeTab === 'assurance' ? styles.active : ''}`}>
            <div className={styles.cardField}>
              <label>Quel type d&apos;assurance ?</label>
              <select value={heroInsuranceType} onChange={(e) => setHeroInsuranceType(e.target.value)}>
                <option>Auto</option>
                <option>Habitation</option>
                <option>Mutuelle Santé</option>
                <option>Assurance Emprunteur</option>
                <option>PER — Épargne Retraite</option>
                <option>RC Professionnelle</option>
                <option>Multirisque Professionnelle</option>
                <option>Flotte Automobile</option>
                <option>Mutuelle Santé Collective</option>
                <option>Prévoyance TNS</option>
              </select>
            </div>
            <div className={styles.cardField}>
              <label>Votre profil</label>
              <select value={heroProfile} onChange={(e) => setHeroProfile(e.target.value)}>
                <option>Particulier</option>
                <option>Professionnel</option>
              </select>
            </div>
            <button className={styles.cardCta} onClick={() => openModal('auto')}>
              Comparer mes offres
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className={`${styles.tabContent} ${activeTab === 'energie' ? styles.active : ''}`}>
            <div className={styles.cardField}>
              <label>Type d&apos;énergie</label>
              <select value={heroEnergyType} onChange={(e) => setHeroEnergyType(e.target.value)}>
                <option>Électricité</option>
                <option>Gaz</option>
                <option>Électricité + Gaz</option>
              </select>
            </div>
            <div className={styles.cardField}>
              <label>Facture mensuelle — <span>{sliderValue}</span> €</label>
              <div className={styles.sliderRow}>
                <span style={{fontSize: '11px', color: 'var(--gray-light)'}}>50€</span>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  value={sliderValue}
                  step="10"
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                />
                <span style={{fontSize: '11px', color: 'var(--gray-light)'}}>2000€</span>
              </div>
            </div>
            <button className={styles.cardCta} onClick={() => openModal('generic')}>
              Optimiser ma facture
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Multi-step Form Modal - Only render if not embedded OR if embedded and modal is open OR if modal-only mode */}
      {(((!isEmbedded && isModalOpen) || isModalOnlyMode)) && (
        <div
          className={`${isModalOnlyMode ? styles.modalOnlyContainer : styles.modalOverlay} ${styles.active}`}
          onClick={isModalOnlyMode ? undefined : handleOverlayClick}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {formType === 'auto' ? 'Assurance Auto' : 'Votre devis'}
              </h2>
              <button className={styles.modalClose} onClick={closeModal}>
                ×
              </button>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{width: `${progressWidth}%`}}></div>
            </div>
            <div className={styles.modalBody}>
              {/* Success Screen */}
              {showSuccess ? (
                <div className={styles.successScreen}>
                  <div className={styles.successIcon}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="38" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="2"/>
                      <path d="M25 40L35 50L55 30" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className={styles.successTitle}>Demande envoyée avec succès !</h3>
                  <p className={styles.successMessage}>
                    Merci ! Votre demande a bien été envoyée. Vous allez être redirigé vers notre calendrier pour réserver votre créneau gratuit.
                  </p>
                  <button className={styles.btnSuccess} onClick={closeModal}>
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  {/* Auto Form Steps */}
                  {formType === 'auto' && (
                    <>
                      {currentStep === 0 && (
                        <div className={styles.formStep}>
                          <p className={styles.stepQuestion}>Parlez-nous de votre véhicule</p>
                          <div className={styles.formGroup}>
                            <label>Marque & modèle</label>
                            <input
                              type="text"
                              placeholder="Ex : Renault Clio"
                              value={vehicleBrand}
                              onChange={(e) => setVehicleBrand(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Année de mise en circulation</label>
                            <input
                              type="text"
                              placeholder="Ex : 2019"
                              value={vehicleYear}
                              onChange={(e) => setVehicleYear(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {currentStep === 1 && (
                        <div className={styles.formStep}>
                          <p className={styles.stepQuestion}>Votre historique conducteur</p>
                          <div className={styles.formGroup}>
                            <label>Bonus-Malus (0.50 → 3.50) — {(bonusMalus / 100).toFixed(2)}</label>
                            <input
                              type="range"
                              min="50"
                              max="350"
                              value={bonusMalus}
                              step="5"
                              onChange={(e) => setBonusMalus(Number(e.target.value))}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Date d&apos;obtention du permis</label>
                            <input
                              type="text"
                              placeholder="MM/AAAA"
                              value={licenseDate}
                              onChange={(e) => setLicenseDate(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Assureur actuel</label>
                            <input
                              type="text"
                              placeholder="Ex : Maaf, Axa..."
                              value={currentInsurer}
                              onChange={(e) => setCurrentInsurer(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Montant mensuel actuel</label>
                            <input
                              type="text"
                              placeholder="Ex : 58 €"
                              value={currentMonthlyCost}
                              onChange={(e) => setCurrentMonthlyCost(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className={styles.formStep}>
                          <p className={styles.stepQuestion}>Vos coordonnées</p>
                          <div className={styles.formGroup}>
                            <label>Prénom</label>
                            <input
                              type="text"
                              placeholder="Votre prénom"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Nom</label>
                            <input
                              type="text"
                              placeholder="Votre nom"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Téléphone</label>
                            <input
                              type="tel"
                              placeholder="06 00 00 00 00"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                              type="email"
                              placeholder="votre@email.fr"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          <div className={styles.gdprCheck}>
                            <input
                              type="checkbox"
                              id="gdpr"
                              checked={gdprConsent}
                              onChange={(e) => setGdprConsent(e.target.checked)}
                            />
                            <label htmlFor="gdpr">
                              J&apos;accepte que mes données soient utilisées pour traiter ma demande de devis, conformément à la politique de confidentialité d&apos;OPTINA.
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Generic Form Steps */}
                  {formType === 'generic' && (
                    <>
                      {currentStep === 0 && (
                        <div className={styles.formStep}>
                          <p className={styles.stepQuestion}>Parlez-nous de votre situation</p>
                          <div className={styles.formGroup}>
                            <label>Votre profil</label>
                            <div className={styles.radioGroup}>
                              <div
                                className={`${styles.radioOption} ${selectedRadio === 'Particulier' ? styles.selected : ''}`}
                                onClick={() => handleRadioSelect('Particulier')}
                              >
                                Particulier
                              </div>
                              <div
                                className={`${styles.radioOption} ${selectedRadio === 'Professionnel' ? styles.selected : ''}`}
                                onClick={() => handleRadioSelect('Professionnel')}
                              >
                                Professionnel
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 1 && (
                        <div className={styles.formStep}>
                          <p className={styles.stepQuestion}>Vos coordonnées</p>
                          <div className={styles.formGroup}>
                            <label>Prénom</label>
                            <input
                              type="text"
                              placeholder="Votre prénom"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Nom</label>
                            <input
                              type="text"
                              placeholder="Votre nom"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Téléphone</label>
                            <input
                              type="tel"
                              placeholder="06 00 00 00 00"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                              type="email"
                              placeholder="votre@email.fr"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          <div className={styles.gdprCheck}>
                            <input
                              type="checkbox"
                              id="gdpr-generic"
                              checked={gdprConsent}
                              onChange={(e) => setGdprConsent(e.target.checked)}
                            />
                            <label htmlFor="gdpr-generic">
                              J&apos;accepte que mes données soient utilisées pour traiter ma demande de devis, conformément à la politique de confidentialité d&apos;OPTINA.
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {!showSuccess && (
            <div className={styles.modalFooter}>
              {currentStep > 0 && (
                <button className={styles.btnPrev} onClick={handlePrevStep} disabled={isSubmitting}>
                  Retour
                </button>
              )}
              <button className={styles.btnNext} onClick={handleNextStep} disabled={isSubmitting}>
                {isSubmitting ? (
                  'Envoi en cours...'
                ) : currentStep === totalSteps - 1 ? (
                  <>
                    Envoyer ma demande
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8l12-6-6 12-2-4z" fill="white"/>
                    </svg>
                  </>
                ) : (
                  <>
                    Suivant
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
