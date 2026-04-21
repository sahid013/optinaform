'use client';

import { useState } from 'react';
import styles from './MultiDevisForm.module.css';

// Webhook URL
const WEBHOOK_URL = 'https://nassimaali.app.n8n.cloud/webhook/024b4d77-576e-4656-9ab4-00b00ab0bd11';

type InsuranceType = 'auto' | 'habitation' | 'mutuelle-sante' | 'assurance-emprunteur' |
  'per-epargne' | 'rc-pro' | 'flotte-auto' | 'mutuelle-collective' | 'prevoyance-tns' | 'optimisation-energie';

export default function MultiDevisForm() {
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceType>('mutuelle-sante');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields - Mutuelle santé
  const [age, setAge] = useState('');
  const [statut, setStatut] = useState('Salarié');
  const [lunettesDentaire, setLunettesDentaire] = useState('Oui');
  const [hospitalise, setHospitalise] = useState('Non');
  const [mutuelleActuelle, setMutuelleActuelle] = useState('');
  const [montantMensuel, setMontantMensuel] = useState('');
  const [contratFile, setContratFile] = useState<File | null>(null);

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);

  const insuranceTypes = [
    { id: 'auto', label: 'Assurance auto', icon: '🚗' },
    { id: 'habitation', label: 'Habitation', icon: '🏠' },
    { id: 'mutuelle-sante', label: 'Mutuelle santé', icon: '💚' },
    { id: 'assurance-emprunteur', label: 'Assurance emprunteur', icon: '🏦' },
    { id: 'per-epargne', label: 'PER — Épargne retraite', icon: '🔥' },
    { id: 'rc-pro', label: 'RC professionnelle', icon: '💼' },
    { id: 'flotte-auto', label: 'Flotte automobile', icon: '🚙' },
    { id: 'mutuelle-collective', label: 'Mutuelle collective', icon: '💚' },
    { id: 'prevoyance-tns', label: 'Prévoyance TNS', icon: '🛡️' },
    { id: 'optimisation-energie', label: 'Optimisation énergie', icon: '⚡' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContratFile(e.target.files[0]);
    }
  };

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

      if (response.ok) {
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

      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        alert(`Erreur: ${error}`);
      }

      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !phone || !email) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!gdprConsent) {
      alert('Veuillez accepter la politique de confidentialité pour continuer.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Veuillez entrer une adresse email valide.');
      return;
    }

    setIsSubmitting(true);

    const formData: any = {
      firstName,
      phone,
      email,
      insuranceType: selectedInsurance,
      submittedAt: new Date().toISOString(),
    };

    // Add insurance-specific data
    if (selectedInsurance === 'mutuelle-sante') {
      formData.age = age;
      formData.statut = statut;
      formData.lunettesDentaire = lunettesDentaire;
      formData.hospitalise = hospitalise;
      formData.mutuelleActuelle = mutuelleActuelle;
      formData.montantMensuel = montantMensuel;
      if (contratFile) {
        formData.contratFileName = contratFile.name;
      }
    }

    const success = await submitToWebhook(formData);
    setIsSubmitting(false);

    if (success) {
      setShowSuccess(true);
      resetForm();
    } else {
      alert('Une erreur s\'est produite. Veuillez réessayer.');
    }
  };

  const resetForm = () => {
    setAge('');
    setStatut('Salarié');
    setLunettesDentaire('Oui');
    setHospitalise('Non');
    setMutuelleActuelle('');
    setMontantMensuel('');
    setContratFile(null);
    setFirstName('');
    setPhone('');
    setEmail('');
    setGdprConsent(false);
  };

  const closeSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <div className={styles.container}>
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
            Merci ! Votre demande a bien été envoyée. Notre équipe vous contactera rapidement.
          </p>
          <button className={styles.btnSuccess} onClick={closeSuccess}>
            Fermer
          </button>
        </div>
      ) : (
        <div className={styles.formCard}>
          <div className={styles.insuranceTypes}>
            {insuranceTypes.map((type) => (
              <button
                key={type.id}
                className={`${styles.insuranceBtn} ${selectedInsurance === type.id ? styles.selected : ''}`}
                onClick={() => setSelectedInsurance(type.id as InsuranceType)}
              >
                <span className={styles.icon}>{type.icon}</span>
                <span className={styles.label}>{type.label}</span>
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>
              {insuranceTypes.find(t => t.id === selectedInsurance)?.label}
            </h2>

            {selectedInsurance === 'mutuelle-sante' && (
              <>
                <div className={styles.formGroup}>
                  <label>Votre âge</label>
                  <input
                    type="text"
                    placeholder="Ex : 35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Statut</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="statut"
                        value="Salarié"
                        checked={statut === 'Salarié'}
                        onChange={(e) => setStatut(e.target.value)}
                      />
                      <span>Salarié</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="statut"
                        value="Indépendant"
                        checked={statut === 'Indépendant'}
                        onChange={(e) => setStatut(e.target.value)}
                      />
                      <span>Indépendant</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="statut"
                        value="Retraité"
                        checked={statut === 'Retraité'}
                        onChange={(e) => setStatut(e.target.value)}
                      />
                      <span>Retraité</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Lunettes ou suivi dentaire ?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="lunettes"
                        value="Oui"
                        checked={lunettesDentaire === 'Oui'}
                        onChange={(e) => setLunettesDentaire(e.target.value)}
                      />
                      <span>Oui</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="lunettes"
                        value="Non"
                        checked={lunettesDentaire === 'Non'}
                        onChange={(e) => setLunettesDentaire(e.target.value)}
                      />
                      <span>Non</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Hospitalisé ces 2 dernières années ?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="hospitalise"
                        value="Oui"
                        checked={hospitalise === 'Oui'}
                        onChange={(e) => setHospitalise(e.target.value)}
                      />
                      <span>Oui</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="hospitalise"
                        value="Non"
                        checked={hospitalise === 'Non'}
                        onChange={(e) => setHospitalise(e.target.value)}
                      />
                      <span>Non</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Mutuelle actuelle</label>
                  <input
                    type="text"
                    placeholder="Ex : Harmonie, MGEN..."
                    value={mutuelleActuelle}
                    onChange={(e) => setMutuelleActuelle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Montant mensuel actuel (€)</label>
                  <input
                    type="text"
                    placeholder="Ex : 50"
                    value={montantMensuel}
                    onChange={(e) => setMontantMensuel(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Contrat actuel (PDF/JPG — optionnel)</label>
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      id="contrat"
                      accept=".pdf,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                    />
                    <label htmlFor="contrat" className={styles.fileLabel}>
                      {contratFile ? contratFile.name : 'Cliquez pour choisir un fichier (PDF ou JPG)'}
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className={styles.formRow}>
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
                <label>Téléphone</label>
                <input
                  type="tel"
                  placeholder="06 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="vous@email.fr"
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
                J&apos;accepte que mes données soient utilisées pour traiter ma demande.{' '}
                <a href="#" className={styles.link}>Voir notre politique de confidentialité.</a>
              </label>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
