import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/neonSchema";
import { eq } from "drizzle-orm";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !user.name) return false;
      
      // Check if user exists in neon DB
      const existingUser = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
      
      if (existingUser.length === 0) {
        // Create new user
        await db.insert(users).values({
          googleId: account?.providerAccountId || user.id || "unknown",
          email: user.email,
          name: user.name,
          profilePicture: user.image || null,
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub; // Map googleId / subject to user.id
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
