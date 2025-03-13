import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface DocumentSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

const DocumentSection: React.FC<DocumentSectionProps> = ({ title, children, delay = 0 }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { 
    once: false,
    amount: 0.2,
    margin: "-100px 0px"
  })

  const variants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        delay: delay,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <motion.section 
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      exit="exit"
      variants={variants}
      className="mb-8"
    >
      <motion.h2 
        className="text-2xl font-semibold text-amber-400 mb-4"
        variants={{
          hidden: { opacity: 0, x: -10 },
          visible: { 
            opacity: 1, 
            x: 0,
            transition: {
              duration: 0.4,
              delay: delay + 0.1
            }
          }
        }}
      >
        {title}
      </motion.h2>
      <motion.div 
        className="space-y-4"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: {
              duration: 0.5,
              delay: delay + 0.2,
              staggerChildren: 0.1
            }
          }
        }}
      >
        {children}
      </motion.div>
    </motion.section>
  )
}

export default DocumentSection 