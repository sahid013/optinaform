'use client';

import { useState, useEffect } from 'react';
import styles from './OptinaForm.module.css';

type FormType = 'auto' | 'generic';

export default function OptinaForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formType, setFormType] = useState<FormType>('auto');
  const [activeTab, setActiveTab] = useState<'assurance' | 'energie'>('assurance');
  const [sliderValue, setSliderValue] = useState(300);
  const [selectedRadio, setSelectedRadio] = useState<string>('Particulier');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalSteps = formType === 'auto' ? 3 : 2;
  const progressWidth = ((currentStep + 1) / totalSteps) * 100;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      // If embedded in iframe, try to prevent parent scroll too
      if (window.parent !== window) {
        try {
          window.parent.document.body.style.overflow = 'hidden';
        } catch (e) {
          // Cross-origin, can't access parent
          console.log('Running in iframe');
        }
      }
    } else {
      document.body.style.overflow = '';
      if (window.parent !== window) {
        try {
          window.parent.document.body.style.overflow = '';
        } catch (e) {
          // Cross-origin, can't access parent
        }
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const openModal = (type: FormType) => {
    setFormType(type);
    setCurrentStep(0);
    setIsModalOpen(true);

    // If embedded in iframe, notify parent window
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'OPTINA_MODAL_OPEN',
        formType: type
      }, '*');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStep(0);

    // If embedded in iframe, notify parent window
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'OPTINA_MODAL_CLOSE'
      }, '*');
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      alert('Merci ! Votre demande a bien été envoyée. Vous allez être redirigé vers notre calendrier pour réserver votre créneau gratuit.');
      closeModal();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
              <select>
                <option>Auto</option>
                <option>Habitation</option>
                <option>Mutuelle Santé</option>
                <option>RC Professionnelle</option>
                <option>Agricole</option>
              </select>
            </div>
            <div className={styles.cardField}>
              <label>Votre profil</label>
              <select>
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
              <select>
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

      {/* Multi-step Form Modal */}
      <div
        className={`${styles.modalOverlay} ${isModalOpen ? styles.active : ''}`}
        onClick={handleOverlayClick}
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
            {/* Auto Form Steps */}
            {formType === 'auto' && (
              <>
                {currentStep === 0 && (
                  <div className={styles.formStep}>
                    <p className={styles.stepQuestion}>Parlez-nous de votre véhicule</p>
                    <div className={styles.formGroup}>
                      <label>Marque & modèle</label>
                      <input type="text" placeholder="Ex : Renault Clio" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Année de mise en circulation</label>
                      <input type="text" placeholder="Ex : 2019" />
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className={styles.formStep}>
                    <p className={styles.stepQuestion}>Votre historique conducteur</p>
                    <div className={styles.formGroup}>
                      <label>Bonus-Malus (0.50 → 3.50)</label>
                      <input type="range" min="50" max="350" defaultValue="100" step="5" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Date d&apos;obtention du permis</label>
                      <input type="text" placeholder="MM/AAAA" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Assureur actuel</label>
                      <input type="text" placeholder="Ex : Maaf, Axa..." />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Montant mensuel actuel</label>
                      <input type="text" placeholder="Ex : 58 €" />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className={styles.formStep}>
                    <p className={styles.stepQuestion}>Vos coordonnées</p>
                    <div className={styles.formGroup}>
                      <label>Prénom</label>
                      <input type="text" placeholder="Votre prénom" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Téléphone</label>
                      <input type="tel" placeholder="06 00 00 00 00" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input type="email" placeholder="votre@email.fr" />
                    </div>
                    <div className={styles.gdprCheck}>
                      <input type="checkbox" id="gdpr" />
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
                      <input type="text" placeholder="Votre prénom" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Téléphone</label>
                      <input type="tel" placeholder="06 00 00 00 00" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input type="email" placeholder="votre@email.fr" />
                    </div>
                    <div className={styles.gdprCheck}>
                      <input type="checkbox" />
                      <label>
                        J&apos;accepte que mes données soient utilisées pour traiter ma demande de devis, conformément à la politique de confidentialité d&apos;OPTINA.
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.modalFooter}>
            {currentStep > 0 && (
              <button className={styles.btnPrev} onClick={handlePrevStep}>
                Retour
              </button>
            )}
            <button className={styles.btnNext} onClick={handleNextStep}>
              {currentStep === totalSteps - 1 ? (
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
        </div>
      </div>
    </div>
  );
}
