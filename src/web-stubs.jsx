import React from 'react';

// react-native stubs
export const View = ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>;
export const Text = ({ children, style, ...props }) => <span style={style} {...props}>{children}</span>;
export const Image = ({ style, ...props }) => <img style={style} {...props} />;
export const TouchableOpacity = ({ children, style, ...props }) => <div style={{ cursor: 'pointer', ...style }} {...props}>{children}</div>;
export const ScrollView = ({ children, style, ...props }) => <div style={{ overflow: 'auto', ...style }} {...props}>{children}</div>;
export const StyleSheet = {
    create: (styles) => styles,
};
export const Platform = {
    OS: 'web',
    select: (objs) => objs.web || objs.default,
};

// expo-av stubs
export const Audio = {
    setAudioModeAsync: async () => { },
    Sound: class {
        loadAsync = async () => { };
        playAsync = async () => { };
        pauseAsync = async () => { };
        stopAsync = async () => { };
        unloadAsync = async () => { };
    },
};

export const Video = ({ style, ...props }) => <video style={style} {...props} />;

export default {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Audio,
    Video,
    ScrollView
};
