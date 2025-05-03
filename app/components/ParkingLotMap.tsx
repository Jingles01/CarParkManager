import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, ActivityIndicator, Text } from 'react-native';
import { db, parkingSpotsCollection } from '../../lib/firebase';
import { onSnapshot, collection, query, where, QueryConstraint, orderBy, QueryDocumentSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { ParkingSpotData } from '@/types';
import globalStyles, { COLORS } from '../styles/global';

interface ParkingLotMapProps {
    lotId: string;
    onSpotSelected: (spotInfo: { id: string; label: string }) => void;
    currentSelectedSpotId?: string | null;
}

const ParkingLotMap: React.FC<ParkingLotMapProps> = ({
    lotId,
    onSpotSelected,
    currentSelectedSpotId
}) => {
    const [parkingSpots, setParkingSpots] = useState<ParkingSpotData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    useEffect(() => {
        const currentLotId = lotId;
        if (!currentLotId) {
            setError("No Lot ID provided to ParkingLotMap.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        console.log(`ParkingLotMap: Setting up listener for lotId: ${currentLotId}`);

        const constraints: QueryConstraint[] = [ where('lotId', '==', currentLotId) ];
        const q = query(parkingSpotsCollection, ...constraints);

        const unsubscribe = onSnapshot(q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                 console.log(`ParkingLotMap: Snapshot received for lot ${currentLotId}, docs: ${snapshot.docs.length}`);
                const spots: ParkingSpotData[] = [];
                 snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data();
                     if (typeof data.x === 'number' && typeof data.y === 'number' &&
                         typeof data.width === 'number' && typeof data.height === 'number' &&
                         typeof data.status === 'string') {
                            spots.push({
                                id: doc.id,
                                x: data.x, y: data.y,
                                width: data.width, height: data.height,
                                status: data.status as ParkingSpotData['status'],
                                label: data.label || doc.id,
                                lotId: data.lotId,
                            });
                     } else {
                         console.warn(`ParkingLotMap: Spot ${doc.id} has missing/invalid data.`);
                     }
                });
                setParkingSpots(spots);
                setLoading(false);
            },
            (err) => {
                console.error(`ParkingLotMap: Error fetching spots for lot ${currentLotId}:`, err);
                setError("Failed to load parking spots.");
                setLoading(false);
            }
        );

        return () => {
            console.log(`ParkingLotMap: Unsubscribing listener for lotId: ${currentLotId}`);
            unsubscribe();
        };
    }, [lotId]);

    const { viewBoxOriginX, viewBoxOriginY, viewBoxWidth, viewBoxHeight, svgWidth, svgHeight } = useMemo(() => {
        if (parkingSpots.length === 0) {
            return { viewBoxOriginX: 0, viewBoxOriginY: 0, viewBoxWidth: 100, viewBoxHeight: 100, svgWidth: 100, svgHeight: 100 };
        }
        const padding = 15;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        parkingSpots.forEach(spot => {
            minX = Math.min(minX, spot.x);
            minY = Math.min(minY, spot.y);
            maxX = Math.max(maxX, spot.x + spot.width);
            maxY = Math.max(maxY, spot.y + spot.height);
        });

         minX = Math.min(minX, 0);
         minY = Math.min(minY, 0);
         maxX = Math.max(maxX, 1);
         maxY = Math.max(maxY, 1);

        const vbWidth = (maxX - minX) + padding * 2;
        const vbHeight = (maxY - minY) + padding * 2;
        const vbOriginX = minX - padding;
        const vbOriginY = minY - padding;

        const contentAspectRatio = vbWidth / vbHeight;
        const maxSvgWidth = screenWidth * 0.95;
        const maxSvgHeight = screenHeight * 0.6;

        let finalSvgWidth = maxSvgWidth;
        let finalSvgHeight = maxSvgHeight;

        if (isNaN(contentAspectRatio) || !isFinite(contentAspectRatio) || contentAspectRatio <= 0) {
             finalSvgWidth = 100; finalSvgHeight = 100;
        } else if (contentAspectRatio > maxSvgWidth / maxSvgHeight) {
            finalSvgHeight = maxSvgWidth / contentAspectRatio;
        } else {
            finalSvgWidth = maxSvgHeight * contentAspectRatio;
        }
        finalSvgWidth = Math.max(finalSvgWidth, 1);
        finalSvgHeight = Math.max(finalSvgHeight, 1);

        return { viewBoxOriginX: vbOriginX, viewBoxOriginY: vbOriginY, viewBoxWidth: vbWidth, viewBoxHeight: vbHeight, svgWidth: finalSvgWidth, svgHeight: finalSvgHeight };

    }, [parkingSpots, screenWidth, screenHeight]);


    const handleSpotPress = useCallback((spot: ParkingSpotData) => {
        if (spot.status === 'available') {
            onSpotSelected({ id: spot.id || '', label: spot.label });
        } else {
            console.log('ParkingLotMap: Non-available spot pressed:', spot.id);
        }
    }, [onSpotSelected]);

    const getSpotStyle = useCallback((spot: ParkingSpotData) => {
        const isSelected = spot.id === currentSelectedSpotId;
        const availableFill = '#c8e6c9';
        const occupiedFill = '#ffcdd2';
        const defaultFill = '#e0e0e0';

        let fillColor = defaultFill;
        let strokeColor = COLORS.textSecondary;
        let opacity = 0.8;

        switch (spot.status) {
            case 'available':
                fillColor = availableFill;
                strokeColor = COLORS.success;
                opacity = 1.0;
                break;
            case 'occupied':
                fillColor = occupiedFill;
                strokeColor = COLORS.error;
                opacity = 0.9;
                break;
        }

        const showSelectedStyle = isSelected && spot.status === 'available';

        return {
            fill: fillColor,
            stroke: showSelectedStyle ? COLORS.primary : strokeColor,
            strokeWidth: showSelectedStyle ? 1.5 : 0.7,
            opacity: opacity,
        };
    }, [currentSelectedSpotId]);


    if (loading) {
        return <View style={globalStyles.centeredContainer}>
                   <ActivityIndicator size="large" color={COLORS.primary} />
                   <Text style={globalStyles.infoText}>Loading parking spots...</Text>
               </View>;
    }
    if (error) {
        return <View style={globalStyles.centeredContainer}>
                   <Text style={globalStyles.errorText}>{error}</Text>
               </View>;
    }
    if (!loading && parkingSpots.length === 0) {
        return <View style={globalStyles.centeredContainer}>
                   <Text style={globalStyles.infoText}>No spots configured for Lot {lotId}.</Text>
               </View>;
    }

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            style={styles.scrollView}
            horizontal={true}
        >
            <Svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`${viewBoxOriginX} ${viewBoxOriginY} ${viewBoxWidth} ${viewBoxHeight}`}
            >
                {parkingSpots.map((spot) => {
                    const styleProps = getSpotStyle(spot);
                    const fontSize = Math.max(Math.min(spot.width, spot.height) / 2.5, 6);

                    return (
                        <G
                            key={spot.id}
                            onPress={() => handleSpotPress(spot)}
                            disabled={spot.status !== 'available'}
                        >
                            <Rect
                                x={spot.x} y={spot.y}
                                width={spot.width} height={spot.height}
                                rx={2} ry={2}
                                {...styleProps}
                            />
                            <SvgText
                                x={spot.x + spot.width / 2}
                                y={spot.y + spot.height / 2}
                                fontSize={fontSize}
                                fill={styleProps.opacity > 0.7 ? COLORS.textPrimary : COLORS.textSecondary}
                                fontWeight="500"
                                textAnchor="middle"
                                alignmentBaseline="central"
                                pointerEvents="none"
                            >
                                {spot.label}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        width: '100%',
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        alignSelf: 'center',
    },
    scrollContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        minWidth: '100%',
        minHeight: '100%',
    },
});

export default ParkingLotMap;