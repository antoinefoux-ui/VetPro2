import OpenAI from 'openai';
import { prisma } from '../server';
import logger from '../utils/logger';
import { uploadToS3 } from '../utils/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface ExtractedMedicalData {
  diagnoses: Array<{
    name: string;
    severity?: string;
    notes?: string;
  }>;
  prescriptions: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration?: string;
    route?: string;
    instructions?: string;
  }>;
  procedures: Array<{
    name: string;
    type: string;
    notes?: string;
  }>;
  vitals: {
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    weight?: number;
  };
  labTests: Array<{
    testType: string;
    reason?: string;
  }>;
  findings: string[];
  assessment: string;
  plan: string;
}

export class VoiceRecognitionService {
  
  /**
   * Transcribe audio file using OpenAI Whisper
   */
  static async transcribeAudio(audioFilePath: string): Promise<string> {
    try {
      logger.info(`Transcribing audio file: ${audioFilePath}`);

      const transcription = await openai.audio.transcriptions.create({
        file: await this.loadAudioFile(audioFilePath),
        model: 'whisper-1',
        language: 'en', // Can be 'sk' for Slovak
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      logger.info(`Transcription completed: ${transcription.text.length} characters`);
      
      return transcription.text;

    } catch (error) {
      logger.error('Error transcribing audio:', error);
      throw new Error('Audio transcription failed');
    }
  }

  /**
   * Identify speakers using voice fingerprinting
   * In production, this would use a dedicated speaker diarization service
   * For now, we'll use GPT-4 to identify speakers based on context
   */
  static async identifySpeakers(
    transcription: string,
    staffProfiles: Array<{ id: string; name: string; role: string }>
  ): Promise<SpeakerSegment[]> {
    try {
      const prompt = `
You are analyzing a veterinary consultation transcript. Identify who is speaking in each part.

Available speakers:
${staffProfiles.map(s => `- ${s.name} (${s.role})`).join('\n')}
- Owner (pet owner/client)

Transcript:
${transcription}

Return a JSON array of segments with this structure:
[
  {
    "speaker": "Dr. Smith" | "Owner" | "Nurse Sarah",
    "start": 0,
    "end": 45,
    "text": "what they said"
  }
]

Only return the JSON array, nothing else.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a medical transcription AI that identifies speakers in conversations. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.segments || [];

    } catch (error) {
      logger.error('Error identifying speakers:', error);
      // Fallback: return entire transcription as unknown speaker
      return [{
        speaker: 'Unknown',
        start: 0,
        end: 0,
        text: transcription,
      }];
    }
  }

  /**
   * Extract structured medical data from transcription using GPT-4
   */
  static async extractMedicalData(transcription: string): Promise<ExtractedMedicalData> {
    try {
      logger.info('Extracting medical data from transcription');

      const prompt = `
You are a veterinary AI assistant. Extract structured medical information from this consultation transcript.

Transcript:
${transcription}

Extract and return a JSON object with this exact structure:
{
  "diagnoses": [
    {
      "name": "diagnosis name",
      "severity": "mild|moderate|severe",
      "notes": "additional notes"
    }
  ],
  "prescriptions": [
    {
      "medication": "medication name",
      "dosage": "amount (e.g., 10mg, 2 drops)",
      "frequency": "how often (e.g., twice daily, every 8 hours)",
      "duration": "how long (e.g., 10 days, 2 weeks)",
      "route": "oral|topical|injection|otic|ophthalmic",
      "instructions": "specific instructions"
    }
  ],
  "procedures": [
    {
      "name": "procedure name",
      "type": "examination|surgery|diagnostic|treatment",
      "notes": "details"
    }
  ],
  "vitals": {
    "temperature": number (in Celsius),
    "heartRate": number (bpm),
    "respiratoryRate": number (breaths/min),
    "weight": number (kg)
  },
  "labTests": [
    {
      "testType": "CBC|Chemistry|Urinalysis|etc",
      "reason": "why ordered"
    }
  ],
  "findings": ["array of physical exam findings"],
  "assessment": "summary of assessment",
  "plan": "treatment plan summary"
}

Only extract information explicitly mentioned. Use null for missing values.
Return only valid JSON, no markdown or explanation.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a veterinary medical data extraction AI. Extract structured data from clinical notes. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}');
      
      logger.info(`Extracted data: ${extracted.diagnoses?.length || 0} diagnoses, ${extracted.prescriptions?.length || 0} prescriptions`);

      return extracted as ExtractedMedicalData;

    } catch (error) {
      logger.error('Error extracting medical data:', error);
      throw new Error('Medical data extraction failed');
    }
  }

  /**
   * Generate clinical report from extracted data
   */
  static async generateReport(
    petName: string,
    ownerName: string,
    extractedData: ExtractedMedicalData,
    transcription: string
  ): Promise<string> {
    try {
      const prompt = `
Generate a professional veterinary medical report from this data:

Patient: ${petName}
Owner: ${ownerName}

Extracted Data:
${JSON.stringify(extractedData, null, 2)}

Original Transcript:
${transcription}

Generate a complete SOAP (Subjective, Objective, Assessment, Plan) format medical report.
Use professional veterinary medical terminology.
Be concise but thorough.
Format nicely with sections.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a veterinary medical report writer. Generate professional, concise SOAP reports.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      });

      return response.choices[0].message.content || '';

    } catch (error) {
      logger.error('Error generating report:', error);
      throw new Error('Report generation failed');
    }
  }

  /**
   * Process complete consultation recording
   */
  static async processConsultationRecording(data: {
    appointmentId: string;
    audioFilePath: string;
    roomNumber: string;
  }): Promise<{
    voiceRecordingId: string;
    transcription: string;
    extractedData: ExtractedMedicalData;
    report: string;
  }> {
    try {
      logger.info(`Processing consultation recording for appointment ${data.appointmentId}`);

      // 1. Upload audio to S3
      const audioUrl = await uploadToS3(data.audioFilePath, 'voice-recordings');

      // 2. Transcribe audio
      const transcription = await this.transcribeAudio(data.audioFilePath);

      // 3. Get staff who might be in the room
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
        include: {
          vet: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          pet: {
            select: {
              name: true,
              client: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // 4. Identify speakers
      const staffProfiles = appointment.vet 
        ? [{
            id: appointment.vet.id,
            name: `${appointment.vet.firstName} ${appointment.vet.lastName}`,
            role: appointment.vet.role,
          }]
        : [];

      const speakerSegments = await this.identifySpeakers(transcription, staffProfiles);

      // 5. Extract medical data
      const extractedData = await this.extractMedicalData(transcription);

      // 6. Generate report
      const report = await this.generateReport(
        appointment.pet.name,
        `${appointment.pet.client.firstName} ${appointment.pet.client.lastName}`,
        extractedData,
        transcription
      );

      // 7. Calculate audio duration (mock for now)
      const durationSeconds = Math.floor(transcription.length / 10); // Rough estimate

      // 8. Save to database
      const voiceRecording = await prisma.voiceRecording.create({
        data: {
          appointmentId: data.appointmentId,
          roomNumber: data.roomNumber,
          recordingUrl: audioUrl,
          durationSeconds,
          transcription,
          speakerDiarization: { segments: speakerSegments },
          aiExtractedData: extractedData,
          processed: true,
        },
      });

      // 9. Create draft visit note
      await prisma.visitNote.create({
        data: {
          appointmentId: data.appointmentId,
          petId: appointment.pet.id,
          veterinarianId: appointment.vet?.id,
          chiefComplaint: extractedData.diagnoses[0]?.name || 'Consultation',
          history: transcription.substring(0, 500),
          physicalExam: {
            vitals: extractedData.vitals,
            findings: extractedData.findings,
          },
          assessment: extractedData.assessment,
          plan: extractedData.plan,
          voiceRecordingUrl: audioUrl,
          transcription,
          aiExtractedData: extractedData,
          isDraft: true, // Requires vet approval
        },
      });

      logger.info(`Consultation processed successfully: ${voiceRecording.id}`);

      return {
        voiceRecordingId: voiceRecording.id,
        transcription,
        extractedData,
        report,
      };

    } catch (error) {
      logger.error('Error processing consultation recording:', error);
      throw error;
    }
  }

  /**
   * Generate draft invoice from extracted data
   */
  static async generateDraftInvoice(
    appointmentId: string,
    extractedData: ExtractedMedicalData
  ): Promise<string> {
    try {
      logger.info(`Generating draft invoice for appointment ${appointmentId}`);

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          pet: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Generate invoice number
      const invoiceCount = await prisma.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

      // Map extracted data to invoice items
      const items: any[] = [];
      let subtotal = 0;

      // Add consultation fee
      const consultationFee = 40.00;
      items.push({
        itemType: 'service',
        description: `Office Visit - ${appointment.appointmentType}`,
        quantity: 1,
        unitPrice: consultationFee,
        taxRate: 20,
        subtotal: consultationFee,
        total: consultationFee * 1.20,
      });
      subtotal += consultationFee;

      // Add medications
      for (const rx of extractedData.prescriptions || []) {
        // Look up medication in inventory
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            name: { contains: rx.medication, mode: 'insensitive' },
          },
        });

        const price = inventoryItem?.sellingPrice || 25.00; // Default price
        items.push({
          itemType: 'medication',
          description: `${rx.medication} (${rx.dosage} ${rx.frequency} for ${rx.duration || 'as needed'})`,
          quantity: 1,
          unitPrice: price,
          taxRate: 20,
          inventoryItemId: inventoryItem?.id,
          subtotal: price,
          total: price * 1.20,
        });
        subtotal += price;
      }

      // Add lab tests
      for (const test of extractedData.labTests || []) {
        const testPrice = 30.00; // Default price, should be looked up
        items.push({
          itemType: 'diagnostic',
          description: `${test.testType} Test`,
          quantity: 1,
          unitPrice: testPrice,
          taxRate: 20,
          subtotal: testPrice,
          total: testPrice * 1.20,
        });
        subtotal += testPrice;
      }

      // Add procedures
      for (const procedure of extractedData.procedures || []) {
        const procedurePrice = 50.00; // Should be looked up
        items.push({
          itemType: 'service',
          description: procedure.name,
          quantity: 1,
          unitPrice: procedurePrice,
          taxRate: 20,
          subtotal: procedurePrice,
          total: procedurePrice * 1.20,
        });
        subtotal += procedurePrice;
      }

      const taxAmount = subtotal * 0.20;
      const totalAmount = subtotal + taxAmount;

      // Create draft invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          clientId: appointment.pet.clientId,
          petId: appointment.pet.id,
          appointmentId,
          status: 'draft',
          subtotal,
          taxAmount,
          totalAmount,
          balanceDue: totalAmount,
          aiGenerated: true,
          items: {
            create: items,
          },
        },
        include: {
          items: true,
        },
      });

      logger.info(`Draft invoice created: ${invoice.id}`);

      return invoice.id;

    } catch (error) {
      logger.error('Error generating draft invoice:', error);
      throw error;
    }
  }

  /**
   * Helper: Load audio file
   */
  private static async loadAudioFile(path: string): Promise<File> {
    // In production, this would read from filesystem
    // For now, return mock
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(path);
    return new File([fileBuffer], path.split('/').pop() || 'audio.mp3');
  }

  /**
   * Real-time transcription stream (for live consultations)
   */
  static async streamTranscription(
    audioStream: ReadableStream,
    onTranscript: (text: string) => void,
    onSpeakerChange: (speaker: string) => void
  ): Promise<void> {
    // This would integrate with real-time transcription services
    // Like AssemblyAI or Deepgram for streaming
    logger.info('Real-time transcription not yet implemented');
    // TODO: Implement streaming transcription
  }

  /**
   * Voice profile matching for speaker identification
   */
  static async matchVoiceProfile(
    audioSample: Buffer,
    staffId: string
  ): Promise<number> {
    // This would use voice biometric matching
    // For now, return mock confidence score
    logger.info(`Matching voice profile for staff ${staffId}`);
    return 0.85; // 85% confidence
  }

  /**
   * Create voice profile for staff member
   */
  static async createVoiceProfile(
    audioSample: Buffer,
    staffId: string
  ): Promise<string> {
    try {
      // Upload voice sample
      const voiceProfileUrl = await uploadToS3(
        audioSample as any,
        `voice-profiles/${staffId}.wav`
      );

      // Update staff profile
      await prisma.user.update({
        where: { id: staffId },
        data: { voiceProfileUrl },
      });

      logger.info(`Voice profile created for staff ${staffId}`);

      return voiceProfileUrl;

    } catch (error) {
      logger.error('Error creating voice profile:', error);
      throw error;
    }
  }
}
