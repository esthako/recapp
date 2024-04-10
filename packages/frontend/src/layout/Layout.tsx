import { PropsWithChildren } from "react";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import { Container } from "react-bootstrap";

type Props = PropsWithChildren;

export const Layout = (props: Props) => {
    return (
        <div>
            <div className="fixed-top">
                <HeaderSection />
            </div>
            <Container style={{ marginTop: 60 }}>
                <main
                    style={{
                        width: "100%",
                        padding: "0 12px",
                    }}
                >
                    {props.children}
                </main>
            </Container>
            <div className="fixed-bottom">
                <FooterSection />
            </div>
        </div>
    );
};
