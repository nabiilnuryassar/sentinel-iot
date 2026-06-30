"use client";

import { motion, useReducedMotion } from 'motion/react';
import type { PropsWithChildren } from 'react';

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as const,
        },
    },
};

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.06,
        },
    },
};

/**
 * Wraps a grid of items with scroll-reveal stagger animation.
 * Degrades to static under prefers-reduced-motion.
 */
export function RevealStagger({ children }: PropsWithChildren) {
    const reduce = useReducedMotion();

    if (reduce) {
        return <>{children}</>;
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
        >
            {children}
        </motion.div>
    );
}

export function RevealItem({ children }: PropsWithChildren) {
    const reduce = useReducedMotion();

    if (reduce) {
        return <>{children}</>;
    }

    return (
        <motion.div variants={itemVariants}>
            {children}
        </motion.div>
    );
}
