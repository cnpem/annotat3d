import React, { useState, useEffect, useRef } from 'react';
import { documentOutline, documentSharp } from 'ionicons/icons';
import { IonAccordion, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';

import { MenuItem } from '../MenuItems';
import FileLoadDialog from './FileLoadDialog';
import FileSaveDialog from './FileSaveDialog';
import { sfetch } from '../../../utils/simplerequest';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import { ImageInfoInterface } from './utils/ImageInfoInterface';

import ComponentList from './ComponentList';
import { useStorageState } from 'react-storage-hooks';

/**
 * File I/O and active components display
 * @constructor
 */
const File: React.FC = () => {
    /**
     * file items
     */
    const items: MenuItem = {
        title: 'Files',
        subItems: ['Load Files', 'Save Files'],
        iosIcon: documentOutline,
        mdIcon: documentSharp,
    };
    const [ImageInfo, setImageInfo] = useStorageState<ImageInfoInterface | null>(localStorage, 'ImageInfo', null);
    // Initialize as null since it will be updated with info    // State to track active components
    const [activeComponents, setActiveComponents] = useState<string[]>([]);
    const [annotationCount, setAnnotationCount] = useState<number>(0);

    // checking with the backend might be redundant, but is a safe method
    const checkActiveComponents = () => {
        void sfetch('POST', '/get_open_images', '', 'json').then((response: string[]) => {
            setActiveComponents(response);
            console.log(activeComponents);
        });
    };

    // event Bus to track label, image and superpixel changes
    useEventBus('LabelLoaded', () => {
        checkActiveComponents();
    });
    useEventBus('superpixelChanged', () => {
        checkActiveComponents();
    });
    useEventBus('ImageLoaded', (info: ImageInfoInterface) => {
        setImageInfo(info); // Update ImageInfo with the new data
        console.log('ImageInfo updated:', info); // Log the updated info
        checkActiveComponents();
    });
    //Is there really a need to check annotation? Since it will be active when image is loaded
    useEventBus('annotationChanged', () => {
        checkActiveComponents();
        setAnnotationCount((prevCount) => prevCount + 1);
    });
    useEventBus('labelChanged', () => {
        checkActiveComponents();
    });
    // Logic for automatic saving of annotations
    const generateTimestampFileName = (info: ImageInfoInterface | null): string => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const month = now.toLocaleString('default', { month: 'short' }).toLowerCase();
        const year = now.getFullYear();

        const imageName = info?.imageName || 'nameless_image'; // Use info passed as argument
        console.log('Generated save file name:', imageName);

        return `${imageName}_${hours}h${minutes}m${seconds}s_${day}_${month}_${year}.pkl`;
    };

    useEffect(() => {
        console.log('annotationChanged:', annotationCount);
        if (annotationCount >= 50) {
            setAnnotationCount(0);
            dispatch('SaveAnnot', generateTimestampFileName(ImageInfo)); // Pass current ImageInfo
        }
    }, [annotationCount, ImageInfo]); // Add ImageInfo to dependencies

    //Save with ctrl+s
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault(); // Prevent default save
                dispatch('SaveAnnot', generateTimestampFileName(ImageInfo)); // Pass current ImageInfo
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [ImageInfo]); // Re-register if ImageInfo changes

    return (
        <IonAccordion>
            <IonItem slot={'header'}>
                <IonIcon slot={'start'} ios={items.iosIcon} md={items.mdIcon} />
                <IonLabel>{items.title}</IonLabel>
            </IonItem>
            <IonList slot={'content'}>
                {/* Wrap ComponentList in a div with a margin-bottom */}
                <div style={{ marginBottom: '8px' }}>
                    <ComponentList components_active={activeComponents} />
                </div>{' '}
                <FileLoadDialog name={items.subItems[0]} />
                <FileSaveDialog name={items.subItems[1]} />
            </IonList>
        </IonAccordion>
    );
};

export default File;
