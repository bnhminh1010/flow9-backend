import cron from 'node-cron';
import { Subscription, Transaction, User } from '../models';
import { sendNotification } from '../routes/notifications';

async function checkSubscriptions(): Promise<void> {
  console.log('Running subscription checker cron job...');

  try {
    const users = await User.find();

    for (const user of users) {
      const userId = user._id.toString();
      const now = new Date();

      const upcomingSubscriptions = await Subscription.find({
        userId,
        isActive: true,
        nextBillingDate: {
          $lte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        },
        notified: false
      });

      for (const sub of upcomingSubscriptions) {
        const diffTime = sub.nextBillingDate.getTime() - now.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const notification = {
          type: 'subscription_reminder',
          title: 'Subscription sắp hết hạn',
          message: `${sub.name} sẽ hết hạn trong ${daysUntil} ngày`,
          data: {
            subscriptionId: sub._id,
            name: sub.name,
            amount: sub.amount,
            nextBillingDate: sub.nextBillingDate,
            daysUntil
          },
          createdAt: new Date()
        };

        sendNotification(userId, notification);

        sub.notified = true;
        sub.lastNotifiedAt = now;
        await sub.save();
      }
    }

    console.log('Subscription checker completed');
  } catch (error) {
    console.error('Subscription checker error:', error);
  }
}

async function processRecurringTransactions(): Promise<void> {
  console.log('Running recurring transactions cron job...');

  try {
    const users = await User.find();

    for (const user of users) {
      const userId = user._id.toString();
      const now = new Date();

      const recurringTransactions = await Transaction.find({
        userId,
        isRecurring: true,
        'recurringConfig.nextRunDate': { $lte: now }
      });

      for (const trans of recurringTransactions) {
        const newTransaction = await Transaction.create({
          userId,
          type: trans.type,
          amount: trans.amount,
          category: trans.category,
          description: trans.description,
          date: trans.recurringConfig!.nextRunDate,
          tags: trans.tags,
          isRecurring: false
        });

        trans.paymentHistory = trans.paymentHistory || [];
        trans.paymentHistory.push({
          date: trans.recurringConfig!.nextRunDate,
          amount: trans.amount,
          status: 'paid',
          transactionId: newTransaction._id as any
        });

        if (trans.recurringConfig!.endDate && trans.recurringConfig!.nextRunDate >= trans.recurringConfig!.endDate) {
          trans.isRecurring = false;
        } else {
          const nextDate = new Date(trans.recurringConfig!.nextRunDate);
          
          switch (trans.recurringConfig!.frequency) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
          }

          trans.recurringConfig!.nextRunDate = nextDate;
        }

        await trans.save();

        const notification = {
          type: 'recurring_created',
          title: 'Recurring transaction created',
          message: `${trans.description || trans.category}: ${trans.amount.toLocaleString('vi-VN')} VND`,
          data: {
            transactionId: newTransaction._id,
            amount: trans.amount,
            category: trans.category
          },
          createdAt: new Date()
        };

        sendNotification(userId, notification);
      }
    }

    console.log('Recurring transactions completed');
  } catch (error) {
    console.error('Recurring transactions error:', error);
  }
}

export function startCronJobs(): void {
  cron.schedule('0 9 * * *', checkSubscriptions);
  
  cron.schedule('0 1 * * *', processRecurringTransactions);

  console.log('Cron jobs scheduled:');
  console.log('- Subscription checker: Daily at 9:00 AM');
  console.log('- Recurring transactions: Daily at 1:00 AM');
}
