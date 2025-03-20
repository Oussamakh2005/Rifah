import { Router } from "express";
import prisma from "../prismaClient.js";
import dayjs from "dayjs";

const pointsRouter = Router();

// قائمة الصلوات والأذكار والنوم مع نقاطها
const activityPoints = {
    "fajr": 0.1,
    "dhuhr": 0.1,
    "asr": 0.1,
    "maghrib": 0.1,
    "isha": 0.1,
    "adhkar_morning": 0.2,
    "adhkar_evening": 0.2,
    "sleep": 0.7
};

// الحد الأقصى للنقاط اليومية
const MAX_DAILY_POINTS = 2;

// 🟢 تسجيل النشاط مع احتساب النقاط
pointsRouter.post("/record", async (req, res) => {
    const { activityType, userId } = req.body;
    const today = dayjs().startOf("day").toISOString();

    if (!activityPoints[activityType]) {
        return res.status(400).json({ message: "❌ نشاط غير صحيح!" });
    }

    try {
        // ✅ حساب مجموع النقاط اليومي للمستخدم
        const todayActivities = await prisma.activity.findMany({
            where: { userId, date: { gte: today } },
            select: { activityType: true }
        });

        const todayPoints = todayActivities.reduce((total, act) => {
            return total + (activityPoints[act.activityType] || 0);
        }, 0);

        // ✅ التحقق من الحد الأقصى اليومي
        if (todayPoints + activityPoints[activityType] > MAX_DAILY_POINTS) {
            return res.status(400).json({ message: "❌ لا يمكنك تجاوز الحد الأقصى اليومي (2 نقاط)." });
        }

        // ✅ تسجيل النشاط
        await prisma.activity.create({
            data: { userId, activityType, date: new Date() }
        });

        // ✅ تحديث النقاط
        await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: activityPoints[activityType] } }
        });

        // ✅ إرسال إشعار إذا كانت النقاط أقل من 0.5
        if (todayPoints + activityPoints[activityType] < 0.5) {
            console.log(`📢 تنبيه للمستخدم ${userId}: مهما كثرت ذنوبك لا تترك صلاتك!`);
        }

        // ✅ التحقق من 5 أيام متتالية والحصول على مكافأة +1 نقطة
        const last5Days = await prisma.activity.findMany({
            where: { userId, date: { gte: dayjs().subtract(5, "days").toISOString() } },
            select: { date: true }
        });

        // حساب الأيام المتتالية التي حصل فيها المستخدم على 1 نقطة على الأقل
        const daysWithOnePoint = new Set(last5Days.map(d => dayjs(d.date).format("YYYY-MM-DD")));
        if (daysWithOnePoint.size === 5) {
            await prisma.user.update({
                where: { id: userId },
                data: { points: { increment: 1 } }
            });
            console.log(`🏆 مكافأة +1 نقطة للمستخدم ${userId} لاستمراره 5 أيام متتالية!`);
        }

        res.json({ message: `✅ تم تسجيل ${activityType} وإضافة ${activityPoints[activityType]} نقطة` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "❌ حدث خطأ أثناء تحديث النقاط." });
    }
});

// 🔵 جلب النقاط الحالية للمستخدم
pointsRouter.get("/user/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        if (!user) {
            return res.status(404).json({ message: "❌ المستخدم غير موجود." });
        }

        res.json({ points: user.points });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "❌ حدث خطأ أثناء جلب النقاط." });
    }
});

// 🟡 جلب الأنشطة المسجلة اليوم
pointsRouter.get("/activities/:userId", async (req, res) => {
    const { userId } = req.params;
    const today = dayjs().startOf("day").toISOString();

    try {
        const activities = await prisma.activity.findMany({
            where: { userId, date: { gte: today } },
            select: { activityType: true }
        });

        res.json({ activities: activities.map(a => a.activityType) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "❌ حدث خطأ أثناء جلب الأنشطة." });
    }
});

// 🏆 جلب قائمة الترتيب (Leaderboard)
pointsRouter.get("/leaderboard", async (req, res) => {
    try {
        const topUsers = await prisma.user.findMany({
            orderBy: { points: "desc" },
            select: { id: true, username: true, points: true },
            take: 10 // إرجاع أفضل 10 مستخدمين فقط
        });

        res.json(topUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "❌ حدث خطأ أثناء جلب الترتيب." });
    }
});

export default pointsRouter;
