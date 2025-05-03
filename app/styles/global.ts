import { StyleSheet } from 'react-native';

const COLORS = {
    primary: 'dodgerblue',
    background: 'whitesmoke',
    surface: 'white',
    textPrimary: 'black',
    textSecondary: 'grey',
    textLight: 'white',
    border: 'lightgray',
    error: 'red',
    success: 'green',
    warning: 'yellow',
};

const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.background,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 15,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    bodyText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        lineHeight: 21,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    successText: {
        color: COLORS.success,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 45,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '500',
        color: COLORS.textLight,
    },
    buttonSecondary: {
        backgroundColor: COLORS.surface,
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    buttonTextSecondary: {
         color: COLORS.primary,
    },
    buttonDestructive: {
         backgroundColor: COLORS.error,
    },
    buttonTextDestructive: {
         color: COLORS.textLight,
    },
    input: {
        height: 45,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        backgroundColor: COLORS.surface,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: COLORS.surface,
      justifyContent: 'center',
      minHeight: 45,
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        height: 45,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        backgroundColor: COLORS.surface,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
     separator: {
        height: 1,
        backgroundColor: COLORS.border,
     },
});

export default globalStyles;
export { COLORS };