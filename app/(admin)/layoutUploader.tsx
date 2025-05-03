import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { db } from '@/lib/firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { ParkingSpotData } from '@/types';
import globalStyles, { COLORS } from '../styles/global';
interface SpotLayoutJsonEntry {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function LayoutUploaderScreen() {
    const router = useRouter();
    const [targetLotId, setTargetLotId] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const pickDocument = useCallback(async () => {
        setError(null);
        setSuccessMessage(null);
        try {
            const options: DocumentPicker.DocumentPickerOptions = {
                type: 'application/json',
                copyToCacheDirectory: false,
            };
            const result = await DocumentPicker.getDocumentAsync(options);

            console.log("Document Picker result:", result);

             if (!result.canceled && result.assets && result.assets.length > 0) {
                 setSelectedFile(result.assets[0]);
             } else {
                 setSelectedFile(null);
             }
        } catch (err) {
            console.error('Error picking document:', err);
            Alert.alert('Error', 'Could not select file.');
            setError('Could not select file.');
        }
    }, []);

    const handleUploadLayout = useCallback(async () => {
        if (!selectedFile || !targetLotId.trim()) {
            Alert.alert('Error', 'select a JSON layout file and enter a Lot ID.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccessMessage(null);

        let jsonContent: string | null = null;

        try {
            if (Platform.OS === 'web') {
                console.log("Reading file on Web:", selectedFile);
                 const file = selectedFile.file;
                 if (!file) {
                    throw new Error("Could not access the selected file on web.");
                 }
                 jsonContent = await readFileAsTextAsync(file);
                 console.log("Web file content read.");
            } else {
                console.log(`Reading file on Native: ${selectedFile.uri}`);
                jsonContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
                    encoding: FileSystem.EncodingType.UTF8,
                });
                console.log("Native file content read.");
            }

             if (jsonContent === null) {
                 throw new Error("Failed to read file content.");
             }
            let spotsLayout: SpotLayoutJsonEntry[] = [];
            try {
                spotsLayout = JSON.parse(jsonContent);
                console.log(`Parsed ${spotsLayout.length} spot definitions from JSON.`);
                if (!Array.isArray(spotsLayout)) {
                    throw new Error('Invalid JSON format: Root element must be an array.');
                }
                if (spotsLayout.length > 0) {
                    const firstSpot = spotsLayout[0];
                    if (typeof firstSpot.label !== 'string' || typeof firstSpot.x !== 'number' || typeof firstSpot.y !== 'number' || typeof firstSpot.width !== 'number' || typeof firstSpot.height !== 'number') {
                        throw new Error('Invalid JSON format: Array items must contain label(string), x(number), y(number), width(number), height(number).');
                    }
                }
            } catch (parseError: any) {
                throw new Error(`Failed to parse JSON file: ${parseError.message}`);
            }

            if (spotsLayout.length === 0) {
                 setSuccessMessage("JSON file contained 0 spots. No changes made.");
                 setIsProcessing(false);
                 return;
             }

            if (spotsLayout.length > 500) {
                 throw new Error(`Layout too large (${spotsLayout.length} spots). Maximum 500 spots per upload supported.`);
            }

            const batch = writeBatch(db);
            const currentLotId = targetLotId.trim();

            spotsLayout.forEach((spotData, index) => {
                const newSpotRef = doc(collection(db, 'parkingSpots'));
                const firestoreData: Omit<ParkingSpotData, 'id'> = {
                    label: spotData.label,
                    x: spotData.x,
                    y: spotData.y,
                    width: spotData.width,
                    height: spotData.height,
                    lotId: currentLotId,
                    status: 'available',
                };
                batch.set(newSpotRef, firestoreData);
            });

            console.log(`Committing batch with ${spotsLayout.length} new spots...`);
            await batch.commit();
            console.log("Batch committed successfully.");

            setSuccessMessage(`Successfully uploaded layout with ${spotsLayout.length} spots for Lot ID: ${currentLotId}`);
            setSelectedFile(null);
            setTargetLotId('');

        } catch (err: any) {
            console.error('Error uploading layout:', err);
            setError(`Upload failed: ${err.message}`);
            Alert.alert('Upload Failed', err.message);
        } finally {
            setIsProcessing(false);
        }
    }, [selectedFile, targetLotId]);

    function readFileAsTextAsync(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error("FileReader did not return string result."));
                }
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsText(file);
        });
    }

    return (
        <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={styles.contentContainer}>
            <Text style={globalStyles.title}>Upload Parking Lot Layout (JSON)</Text>

            <Text style={[globalStyles.infoText, styles.instructions]}>
                1. Export your parking lot layout as a JSON file.
            </Text>
             <Text style={[globalStyles.infoText, styles.instructions]}>
                 Format: Array of objects with keys: label(string), x(number), y(number), width(number), height(number).
             </Text>
            <Text style={[globalStyles.infoText, styles.instructions]}>
                2. Enter the target Lot ID and select the JSON file. Max 500 spots.
            </Text>

            <Text style={[globalStyles.label, styles.labelMargin]}>Target Lot ID:</Text>
            <TextInput
                style={globalStyles.input}
                placeholder="Enter the Lot ID this layout belongs to"
                placeholderTextColor={COLORS.textSecondary}
                value={targetLotId}
                onChangeText={setTargetLotId}
                editable={!isProcessing}
            />

            <TouchableOpacity
                style={[
                    globalStyles.button,
                    styles.selectButton,
                    isProcessing && styles.disabledButton
                ]}
                onPress={pickDocument}
                disabled={isProcessing}
            >
                <Text style={globalStyles.buttonText}>
                    {selectedFile ? `Selected: ${selectedFile.name}` : "Select Layout JSON File"}
                </Text>
            </TouchableOpacity>

            {selectedFile?.uri && (
                 <Text style={[globalStyles.infoText, styles.filePath]} numberOfLines={1}>
                     Path: {selectedFile.uri}
                 </Text>
             )}

            <View style={styles.uploadButtonContainer}>
                 <TouchableOpacity
                     style={[
                         globalStyles.button,
                         (!selectedFile || !targetLotId.trim() || isProcessing) && styles.disabledButton
                     ]}
                     onPress={handleUploadLayout}
                     disabled={!selectedFile || !targetLotId.trim() || isProcessing}
                 >
                     {isProcessing ? (
                         <ActivityIndicator color={COLORS.textLight} />
                     ) : (
                         <Text style={globalStyles.buttonText}>Upload Layout</Text>
                     )}
                 </TouchableOpacity>
            </View>

             {error && <Text style={[globalStyles.errorText, styles.feedbackText]}>{error}</Text>}
             {successMessage && <Text style={[globalStyles.successText, styles.feedbackText]}>{successMessage}</Text>}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        paddingBottom: 40,
    },
    instructions: {
        marginBottom: 8,
        textAlign: 'left',
    },
    labelMargin: {
        marginTop: 15,
    },
    selectButton: {
    },
    filePath: {
        marginTop: 5,
        marginBottom: 15,
        fontStyle: 'italic',
        textAlign: 'left',
    },
    uploadButtonContainer: {
        marginTop: 25,
    },
    disabledButton: {
        backgroundColor: COLORS.textSecondary,
        borderColor: COLORS.textSecondary,
        opacity: 0.7,
    },
    feedbackText: {
        marginTop: 15,
        fontWeight: 'bold',
    }
});