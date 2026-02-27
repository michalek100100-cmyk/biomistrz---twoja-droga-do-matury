// src/translations/types.ts

export type Language = 'pl' | 'en' | 'es' | 'ch' | 'cz' | 'de' | 'jp';

export interface TranslationSchema {
    common: {
        back: string;
        save: string;
        cancel: string;
        loading: string;
        error: string;
        yourName: string;
        yourNick: string;
        pinCode: string;
        confirm: string;
        loadingApp: string;
        eloReward: string;
        gameStarted: string;
        joinedGame: string;
        backToMap: string;
        resetSuccess: string;
        emergencyRefresh: string;
        addedToCalendar: string;
        completed: string;
        reviewReminderTitle: string;
        reviewReminderSingle: string;
        reviewReminderMultiple: string;
    };
    auth: {
        title: string;
        welcomeBack: string;
        createAccount: string;
        namePlaceholder: string;
        emailPlaceholder: string;
        passwordPlaceholder: string;
        loginButton: string;
        registerButton: string;
        waitButton: string;
        switchToRegister: string;
        switchToLogin: string;
        policyPrefix: string;
        policyLink: string;
        policySuffix: string;
        errorTooManyAttempts: string;
        errorAccountLimit: string;
        errorNameRequired: string;
        errorPolicyRequired: string;
        errorEmailInUse: string;
        errorWeakPassword: string;
        errorInvalidCredential: string;
    };
    bottomNav: {
        home: string;
        arena: string;
        clan: string;
        practice: string;
    };
    settings: {
        title: string;
        subtitle: string;
        darkMode: string;
        darkModeDesc: string;
        sound: string;
        soundDesc: string;
        notifications: string;
        notificationsDesc: string;
        language: string;
        resetProgress: string;
        resetConfirm: string;
        logout: string;
        version: string;
        footer: string;
    };
    studyHelp: {
        sectionTitle: string;
        sectionSubtitle: string;
        pomodoro: {
            title: string;
            desc: string;
            badge: string;
            settingsTitle: string;
            workMin: string;
            breakMin: string;
            longBreakMin: string;
            runningBanner: string;
            sessionsCount: string;
            phases: {
                idle: string;
                work: string;
                break: string;
                longBreak: string;
            };
            tips: {
                idle: string;
                work: string;
                break: string;
                longBreak: string;
            }
        };
        rsvp: {
            title: string;
            desc: string;
            badge: string;
            headerTitle: string;
            headerSubtitle: string;
            introTitle: string;
            introDesc: string;
            introTip: string;
            startButton: string;
            statsWords: string;
            statsTime: string;
            labelYourText: string;
            placeholder: string;
            speedZone: string;
            finishedTitle: string;
            returnButton: string;
        };
        tipsTitle: string;
        mainTip: string;
    };
    home: {
        welcome: string;
        tiles: {
            learn: { label: string; desc: string };
            arena: { label: string; desc: string };
            practice: { label: string; desc: string };
            clan: { label: string; desc: string };
            leaderboard: { label: string; desc: string };
            exams: { label: string; desc: string };
            friends: { label: string; desc: string };
            profile: { label: string; desc: string };
            survey: { label: string; desc: string };
            settings: { label: string; desc: string };
            support: { label: string; desc: string };
            calendar: { label: string; desc: string };
        };
        streakDays: string;
        streakReminder: string;
        activeTimerBadge: string;
        subjects: {
            biology: string;
            chemistry: string;
        };
        module: string;
    };
    topBar: {
        level: string;
        chestnut: string;
    };
    science: {
        errorNotFound: string;
        ultraMode: {
            title: string;
            introDesc: string;
            startButton: string;
            statsWords: string;
            statsTime: string;
            speedZone: string;
            finishedTitle: string;
            returnButton: string;
        };
        header: {
            part: string;
            of: string;
            ultraModeTitle: string;
        };
        mainTopic: string;
        noVideo: string;
        tipTitle: string;
        quizTitle: string;
        quizSuccess: string;
        finishButton: string;
        nextButton: string;
        noChemistryMessage: string;
    };
    quiz: {
        errorReview: string;
        taskOf: string;
        errorOf: string;
        explanationTitle: string;
        success: string;
        correctAnswerTitle: string;
        continue: string;
        check: string;
        true: string;
        false: string;
    };
    friends: {
        title: string;
        subtitle: string;
        addFriend: string;
        closeSearch: string;
        searchPlaceholder: string;
        resultsTitle: string;
        statusFriend: string;
        statusPending: string;
        inviteButton: string;
        noResults: string;
        noFriends: string;
        yourFriends: string;
        addedOn: string;
        removeConfirm: string;
        emptyFriends: string;
        emptySearchTip: string;
    };
    leaderboard: {
        tabs: {
            ranking: string;
            clans: string;
            map: string;
        };
        ranking: {
            title: string;
            refresh: string;
            topLeaders: string;
            yourPosition: string;
            podium: string;
            empty: string;
            prev: string;
            next: string;
            seeMore: string;
            loading: string;
            error: string;
        };
        clans: {
            title: string;
            loading: string;
            empty: string;
            emptyTip: string;
            memberCount: string;
            winrate: string;
        };
        map: {
            title: string;
            subtitle: string;
            loading: string;
            members: string;
            totalElo: string;
            avgWinrate: string;
            memberCount: string;
            moreMembers: string;
            empty: string;
            emptyTip: string;
        };
    };
    profile: {
        title: string;
        subtitle: string;
        achievements: {
            title: string;
            subtitle: string;
            expand: string;
            collapse: string;
            reward: string;
            empty: string;
        };
        avatar: {
            changeLabel: string;
        };
        form: {
            username: string;
            usernamePlaceholder: string;
            activeTitle: string;
            noTitle: string;
            bio: string;
            bioPlaceholder: string;
        };
        stats: {
            totalXp: string;
            streak: string;
            questionsAnswered: string;
        };
        actions: {
            saveChanges: string;
            privacyPolicy: string;
            logout: string;
            saveSuccess: string;
        };
        dangerZone: {
            title: string;
            subtitle: string;
            resetProgress: string;
            resetConfirm1: string;
            deleteAccount: string;
            deleteConfirm1: string;
            deleteConfirm2: string;
            deleteSuccess: string;
            deleteErrorReauth: string;
        };
        dataPrivacy: {
            title: string;
            description: string;
        };
    };
    exam: {
        modes: {
            title: string;
            subtitle: string;
            random: {
                title: string;
                desc: string;
            };
            full: {
                title: string;
                desc: string;
            };
        };
        selection: {
            title: string;
            subtitle: string;
            warning: string;
            inProgress: string;
            start: string;
            resume: string;
        };
        randomSetup: {
            back: string;
            title: string;
            subtitle: string;
            taskCountLabel: string;
            sourceLabel: string;
            actionButton: string;
            loadingNote: string;
            loadingTitle: string;
            loadingDesc: string;
            errorNoTasks: string;
            errorGeneral: string;
        };
        active: {
            finish: string;
            saveAndExit: string;
            checkMode: string;
            solveMode: string;
            points: string;
            randomBadge: string;
            checkButton: string;
            finishButton: string;
            yourScore: string;
            loadingTitle: string;
            loadingProgress: string;
            loadingDesc: string;
            errorLoad: string;
        };
        restartConfirm: string;
    };
    shop: {
        title: string;
        subtitle: string;
        wallet: string;
        buySuccess: string;
        buyError: string;
        buyButton: string;
        comingSoon: string;
    };
    multiplayer: {
        title: string;
        yours: string;
        opponent: string;
        searching: string;
        searchingLong: string;
        found: string;
        ready: string;
        vs: string;
        playButton: string;
        playWithBot: string;
        cancel: string;
        rankTitle: string;
        yourRank: string;
        viewRankingRewards: string;
        rankPathTitle: string;
        rankPathDesc: string;
        claim: string;
        claimed: string;
        matchStartingSoon: string;
        charadesTitle: string;
        charadesDesc: string;
        joinFriends: string;
        enterPin: string;
        createRoom: string;
        privateGame: string;
        joinCharades: string;
        providePinCharades: string;
        enterRoom: string;
        groupChallenge: string;
        groupChallengeDesc: string;
        joinGame: string;
        havePin: string;
        createRoomTitle: string;
        createRoomSubtitle: string;
        inputDataTitle: string;
        inputDataSubtitle: string;
        yourNameLabel: string;
        pinCodeLabel: string;
        enterGameButton: string;
        groupTab: string;
        charadesTab: string;
        lobby: {
            pin: string;
            players: string;
            host: string;
            organizerPanel: string;
            waitingRoom: string;
            startRace: string;
            startCharades: string;
            topicLabel: string;
            topicChoose: string;
            topicChange: string;
            timeLabel: string;
            roundsLabel: string;
            charadesTitle: string;
            charadesDesc: string;
            groupTitle: string;
            groupDesc: string;
            joinTitle: string;
            joinDesc: string;
            createTitle: string;
            createDesc: string;
            nickLabel: string;
            pinLabel: string;
            enterGame: string;
            chooseTopic: string;
            charadesSettings: string;
            charadesSettingsDesc: string;
            close: string;
            errorTopic: string;
            errorPin: string;
            errorNick: string;
            questionsCount: string;
            speedLabel: string;
            standardLabel: string;
            longLabel: string;
            fastGameLabel: string;
            roundsCount: string;
        };
        ranks: string[];
        errors: {
            loginRequired: string;
            rtdbError: string;
            createError: string;
            joinErrorPin: string;
            joinErrorStarted: string;
            joinErrorGeneric: string;
            botError: string;
            charadesError: string;
            startError: string;
        };
        notifications: {
            roomCreated: string;
            roomJoined: string;
            lobbyClosing: string;
            botJoined: string;
        };
    };
    clans: {
        title: string;
        subtitle: string;
        createButton: string;
        joinButton: string;
        createTitle: string;
        joinTitle: string;
        cost: string;
        requirements: string;
        placeholderName: string;
        searchPlaceholder: string;
        nameLabel: string;
        avatarLabel: string;
        eloLabel: string;
        publicLabel: string;
        privateLabel: string;
        locationLabel: string;
        locationOptional: string;
        locationSelected: string;
        creating: string;
        errorCreate: string;
        errorJoin: string;
        noPublicClans: string;
        stats: {
            totalElo: string;
            avgWinrate: string;
            members: string;
        };
        errors: {
            nameRequired: string;
            nameShort: string;
            nameLong: string;
            insufficientElo: string;
            insufficientGems: string;
            alreadyInClan: string;
            alreadyMember: string;
            createError: string;
            joinError: string;
            leaveError: string;
            noClansFound: string;
            notFound: string;
            privateClan: string;
            lowElo: string;
            friendAlreadyMember: string;
            friendInOtherClan: string;
            inviteError: string;
        };
        tabs: {
            info: string;
            map: string;
            boss: string;
            diplomacy: string;
        };
        members: string;
        inviteFriend: string;
        inviting: string;
        inClan: string;
        chat: {
            title: string;
            empty: string;
            placeholder: string;
            error: string;
        };
        actions: {
            leave: string;
            dissolve: string;
            leaveConfirm: string;
            dissolveConfirm: string;
        };
        loading: string;
        boss: {
            title: string;
            loading: string;
            noBoss: string;
            noBossDesc: string;
            questionCount: string;
            points: string;
            finishRaid: string;
            nextQuestion: string;
            disappears: string;
            hpStatus: string;
            damageDealt: string;
            startRaid: string;
            goodAnswerPoints: string;
            activeBuff: string;
            beastDefeated: string;
            congrats: string;
            beastEscaped: string;
            beastEscapedDesc: string;
            clanHeroes: string;
            noHeroes: string;
            unknownHero: string;
            names: {
                virus: string;
                beast: string;
                goliath: string;
                king: string;
            };
            errorLoadQuestions: string;
            errorSaveDamage: string;
        };
        territory: {
            title: string;
            desc: string;
            homeBase: string;
            status: string;
            yourStatus: string;
            occupiedStatus: string;
            neutralStatus: string;
            yield: string;
            perDay: string;
            capture: string;
            strengthen: string;
            attack: string;
        };
        diplomacy: {
            title: string;
            alliances: string;
            alliancesDesc: string;
            market: string;
            marketDesc: string;
            proposeAlliance: string;
            createOffer: string;
            availableOffers: string;
            postOffer: string;
            targetClanId: string;
            targetClanPlaceholder: string;
            sendInvite: string;
            sellItem: string;
            sellPrice: string;
            emptyMarket: string;
            emptyInventory: string;
            emptyInventoryTip: string;
            buyConfirm: string;
            allianceSent: string;
            offerPosted: string;
            itemBought: string;
            errorNoItem: string;
            errorBuy: string;
            price: string;
            from: string;
        };
    };
    intro: {
        welcome: string;
        freeApp: string;
        alone: string;
        aloneDesc: string;
        support: string;
        supportDesc: string;
        letsGo: string;
        next: string;
    };
    calendar: {
        title: string;
        topicsInPlan: string;
        dueToday: string;
        months: string[];
        days: string[];
        dueNow: string;
        plannedReview: string;
        repeat: string;
        emptyTitle: string;
        emptyDesc: string;
    };
    closet: {
        title: string;
        themesTitle: string;
        themesDesc: string;
        reset: string;
        equipped: string;
        owned: string;
        buyConfirm: string;
        cost: string;
        buy: string;
        notEnoughGems: string;
        needMore: string;
        themes: {
            [key: string]: string;
        };
    };
    rewards: {
        title: string;
        desc: string;
        empty: string;
        playMore: string;
        chestTitle: string;
        forLevel: string;
        newItem: string;
    };
    inventory: {
        title: string;
        activeBuffs: string;
        yourItems: string;
        empty: string;
        emptyDesc: string;
        multiplier: string;
        expires: string;
        use: string;
    };
    rarity: {
        common: string;
        rare: string;
        epic: string;
        legendary: string;
        mythic: string;
    };
    items: {
        gold_chest: {
            name: string;
            description: string;
        };
        hero_chest: {
            name: string;
            description: string;
        };
        [key: string]: {
            name: string;
            description: string;
        };
    };
    practiceCenter: {
        title: string;
        subtitle: string;
        library: string;
        savedQuestions: string;
        savedQuestionsDesc: string;
        questionsToReview: string;
        srsTitle: string;
        emptySrsTitle: string;
        emptySrsDesc: string;
        requiredReview: string;
        groupStudy: string;
        groupMode: string;
        groupModeDesc: string;
        masterSection: string;
        topic: string;
        tasks: string;
        fullBase: string;
    };
    notifications: {
        srsTitle: string;
        srsBodySingle: string;
        srsBodyMultiple: string;
        streakTitle: string;
        streakBody: string;
        streakEmpty: string;
        dailyGoalTitle: string;
        dailyGoalBody: string;
        dailyReminderTitle: string;
        dailyReminderDescSingle: string;
        dailyReminderDescMultiple: string;
        dailyReminderBetter: string;
        repeat: string;
        remindLater: string;
    };
    achievements: {
        unlocked: string;
        items: {
            [key: string]: {
                name: string;
                description: string;
            };
        };
    };
    feedback: {
        title: string;
        desc: string;
        placeholder: string;
        messageLabel: string;
        submit: string;
        submitting: string;
        success: string;
        error: string;
        minLengthError: string;
        ratingLabel: string;
        categoryLabel: string;
        categories: {
            bug: string;
            improvement: string;
            idea: string;
            other: string;
        };
    };
    topicActionMenu: {
        subtitle: string;
        learnTitle: string;
        learnDesc: string;
        quizTitle: string;
        quizDesc: string;
    };
    sections: {
        [key: string]: string;
    };
    support: {
        title: string;
        yourSupport: string;
        currency: string;
        contributionDesc: string;
        watchAdTitle: string;
        watchAdSubtitle: string;
        adDisclaimer: string;
        addSupportButton: string;
        thankYou: string;
        buyCoffeeTitle: string;
        buyCoffeeDesc: string;
        patroniteTitle: string;
        patroniteUpcoming: string;
        footerNote: string;
    };
}
