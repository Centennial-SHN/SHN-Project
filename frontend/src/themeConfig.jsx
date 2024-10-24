import React from 'react';
import { ConfigProvider } from 'antd';

const colors = {
    primaryTeal: '#49c6b9', //Teal
    primaryNavy: '#191e72', //Navy Blue
    secondaryCoral: '#f96065', //Coral
    secondaryYellow: '#fec24d', //Yellow
    secondaryGrey: '#3a3a3c', //Grey
    globalBlack: '#1D1E3A', //Black
    globalWhite: '#fff', //White
    globalGrey1: '#F1F2F3', //Grey 1
    globalGrey2: '#D8D9DE', //Grey 2
    globalGrey3: '#C1C2CD', //Grey 3
    globalGrey4: '#A6A8B9', //Grey 4
    globalGrey5: '#8E8FA9', //Grey 5
    globalGrey6: '#717398', //Grey 6
    globalGrey7: '#5C5E84', //Grey 7
    globalGrey8: '#474A6B', //Grey 8
    globalGrey9: '#343655', //Grey 9
    statusSuccess: '#5DE5B5', //Success
    statusWarning: '#FEB934', //Warning
    statusError: '#F8494F', //Error
    statusInfo: '#357CED', //Info
};

export const ThemeProvider = ({ children }) => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    //Default Tokens
                    fontFamily: "'Montserrat', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                    fontWeightStrong: 700,
                    fontWeightNormal: 400,
                    colorPrimary: colors.primaryTeal, //Teal
                    colorTextBase: colors.globalBlack, //Black
                    colorBgBase: colors.globalWhite, //White
                    colorSuccess: colors.statusSuccess, //Success
                    colorWarning: colors.statusWarning, //Warning
                    colorError: colors.statusError, //Error
                    colorInfo: colors.statusInfo, //Info
                    colorLink: colors.primaryTeal, //Teal
                    colorLinkHover: '#6FD2C8',
                    colorTextPlaceholder: '#A6A8B9',
                    linkDecoration: 'underline',
                    borderRadius: 8,
                    borderRadiusLG: 16,
                    controlHeight: 40,
                    boxShadow: "0 4px 4px 0 #F5F5F5, 0 4px 8px 8px rgba(245, 245, 245, 0.5)",

                    //Custom Colors
                    primaryNavy: colors.primaryNavy, //Navy Blue
                    secondaryCoral: colors.secondaryCoral, //Coral
                    secondaryYellow: colors.secondaryYellow, //Yellow
                    secondaryGrey: colors.secondaryGrey, //Grey
                    globalBlack: colors.globalBlack, //Black
                    globalWhite: colors.globalWhite, //White
                    globalGrey1: colors.globalGrey1, //Grey 1
                    globalGrey2: colors.globalGrey2, //Grey 2
                    globalGrey3: colors.globalGrey3, //Grey 3
                    globalGrey4: colors.globalGrey4, //Grey 4
                    globalGrey5: colors.globalGrey5, //Grey 5
                    globalGrey6: colors.globalGrey6, //Grey 6
                    globalGrey7: colors.globalGrey7, //Grey 7
                    globalGrey8: colors.globalGrey8, //Grey 8
                    globalGrey9: colors.globalGrey9, //Grey 9
                },
            }}
        >
            {children}
        </ConfigProvider>
    );
};